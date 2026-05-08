import { TransformNode, Vector3 } from "@babylonjs/core";
import { depenetrateCircleOBB, type OrientedBoxCollider } from "./barrierCollision";
import { OFF_TRACK_MARGIN, OFF_TRACK_RESET_SEC } from "./config";
import type { RaceTrack } from "./track";

export type DriveInput = {
  throttle: number;
  brake: number;
  steer: number;
  reverse: number;
  launchControl?: boolean; // espacio + acelerador = launch control activo
};

const MAX_SPEED   = 94.4; // m/s (~340 km/h tope — tope de 7ª marcha)
const MAX_REVERSE = 14;   // m/s (~50 km/h reversa)
const ACCEL       = 34;   // aceleración — 0-100 en ~3 seg, llega bien a 300+ km/h
const ACCEL_REV   = 30;   // aceleración reversa
const BRAKE       = 380;
const DRAG        = 0.038; // drag bajo — permite llegar a 320-340 km/h en recta larga
const MAX_STEER   = 2.35;
const CAR_RADIUS  = 1.05;

/** Gravedad simulada en pendientes (m/s² por unidad de slope) */
const GRAVITY_SLOPE = 9.8;

export class ArcadeCar {
  readonly root: TransformNode;
  velocity = new Vector3();
  speed = 0;
  yaw = 0;

  private offTrackTimer = 0;
  private rollSmoothed  = 0;
  private pitchSmoothed = 0;
  /** Pendiente actual de la pista (negativo = bajada, positivo = subida) */
  private currentSlope  = 0;
  /** Launch control activo: el carro está retenido con espacio+acelerador */
  launchControlActive = false;
  /** Acumulador de RPM durante launch control (sube mientras se mantiene) */
  launchRpm = 0;

  constructor(root: TransformNode) {
    this.root = root;
  }

  resetTo(position: Vector3, yaw: number): void {
    this.root.position.copyFrom(position);
    this.yaw = yaw;
    this.velocity.setAll(0);
    this.speed = 0;
    this.offTrackTimer = 0;
    this.rollSmoothed  = 0;
    this.pitchSmoothed = 0;
    this.currentSlope  = 0;
    this.launchControlActive = false;
    this.launchRpm = 0;
    this.syncRotation();
  }

  /** Mueve el carro a una posición/yaw sin resetear física — para coches remotos */
  teleportTo(position: Vector3, yaw: number): void {
    this.root.position.copyFrom(position);
    this.yaw = yaw;
    this.syncRotation();
  }

  idleVisuals(dt: number): void {
    const damp = Math.min(1, dt * 6);
    this.rollSmoothed  += (0 - this.rollSmoothed)  * damp;
    this.pitchSmoothed += (0 - this.pitchSmoothed) * damp;
    this.syncRotation();
  }

  update(
    dt: number,
    input: DriveInput,
    track: RaceTrack,
    barriers: readonly OrientedBoxCollider[],
  ): void {
    const throttle = Math.max(0, Math.min(1, input.throttle));
    const brake    = Math.max(0, Math.min(1, input.brake));
    const reverse  = Math.max(0, Math.min(1, input.reverse ?? 0));
    const steer    = Math.max(-1, Math.min(1, input.steer));
    const launchControl = input.launchControl ?? false;

    const forward = new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));

    // ── Launch Control ────────────────────────────────────
    // Espacio + acelerador = retener el carro con rev limiter
    // Al soltar espacio → arranque explosivo
    if (launchControl && throttle > 0 && Math.abs(this.speed) < 2) {
      // Activar launch control: carro quieto, RPM subiendo
      this.launchControlActive = true;
      this.launchRpm = Math.min(1, this.launchRpm + dt * 1.2); // sube en ~0.8 seg
      this.speed = 0;
      this.velocity.setAll(0);
      // Aplicar pendiente pero sin moverse
      const proj2 = track.project(this.root.position);
      this.currentSlope += (proj2.slope - this.currentSlope) * Math.min(1, dt * 4);
      // Visuals: pitch hacia atrás (carga trasera)
      const targetPitch = -0.08 * this.launchRpm;
      this.pitchSmoothed += (targetPitch - this.pitchSmoothed) * Math.min(1, dt * 8);
      this.syncRotation();
      return; // no procesar más física
    }

    // Si acaba de soltar el launch control con RPM cargado → boost de arranque
    if (this.launchControlActive && !launchControl) {
      this.launchControlActive = false;
      // Velocidad inicial proporcional al RPM acumulado (máx ~60 km/h de boost)
      const launchBoost = this.launchRpm * 16.7; // hasta 16.7 m/s = 60 km/h
      this.speed = launchBoost;
      this.launchRpm = 0;
    }

    // ── Física de pendiente ───────────────────────────────
    // slope > 0 = subida → frena el carro
    // slope < 0 = bajada → acelera el carro
    // Suavizar la pendiente para evitar cambios bruscos
    const proj = track.project(this.root.position);
    this.currentSlope += (proj.slope - this.currentSlope) * Math.min(1, dt * 4);
    const gravityEffect = -this.currentSlope * GRAVITY_SLOPE;
    // En subida: gravityEffect negativo → resta velocidad
    // En bajada: gravityEffect positivo → suma velocidad
    this.speed += gravityEffect * dt;

    // ── Aceleración / freno / reversa ─────────────────────
    // W = acelerar adelante
    // S = frenar si vas adelante, reversa solo si ya estás casi parado
    // Espacio = freno de mano (muy potente)

    if (throttle > 0) {
      // Curva de aceleración realista con 7 marchas:
      // A 0 km/h    → aceleración completa (0-100 en ~3 seg)
      // A 200 km/h  → ~50% de aceleración (6ª marcha, sube bien)
      // A 270 km/h  → ~30% de aceleración (entrada 7ª, sigue subiendo)
      // A 340 km/h  → ~5% de aceleración (tope, cuesta llegar pero se puede)
      const speedRatio = Math.max(0, this.speed) / MAX_SPEED;
      const accelFactor = Math.pow(1 - speedRatio, 1.3); // exponente bajo = más fuerza en velocidades altas
      this.speed += throttle * ACCEL * accelFactor * dt;
    }

    if (reverse > 0) {
      if (this.speed > 0.5) {
        // Todavía va hacia adelante → S actúa como freno suave
        this.speed -= reverse * 60 * dt;
      } else if (this.speed > -0.5) {
        // Casi parado → empezar a ir en reversa
        this.speed -= reverse * ACCEL_REV * dt;
      } else {
        // Ya en reversa → seguir acelerando en reversa
        this.speed -= reverse * ACCEL_REV * dt;
      }
    }

    // Espacio = freno de mano potente (no da reversa)
    if (brake > 0) {
      if (this.speed > 0)  this.speed -= brake * BRAKE * dt;
      else if (this.speed < 0) this.speed += brake * BRAKE * 0.5 * dt;
    }

    // Drag aerodinámico — desacelera naturalmente al soltar el acelerador
    this.speed -= this.speed * DRAG * dt;
    this.speed = Math.max(-MAX_REVERSE, Math.min(MAX_SPEED, this.speed));

    // ── Dirección ─────────────────────────────────────────
    const absSpeed = Math.abs(this.speed);
    const speedForSteer = Math.min(1, absSpeed / 4.0);
    const steerScale = (0.38 + 0.62 * (1 - Math.min(1, absSpeed / MAX_SPEED))) * speedForSteer;
    const steerDir = this.speed >= 0 ? 1 : -1;
    this.yaw += steer * steerDir * MAX_STEER * steerScale * dt;

    // ── Velocidad lateral (grip) ──────────────────────────
    const velMag = this.velocity.length();
    const speedRatio = velMag / Math.max(1e-6, MAX_SPEED);
    const steerGripLoss = Math.min(0.72, Math.abs(steer) * speedRatio * 1.15);
    const grip = 1 - steerGripLoss;
    const desired = forward.scale(this.speed);
    this.velocity = Vector3.Lerp(this.velocity, desired, Math.min(1, grip * dt * 7));

    // ── Posición ──────────────────────────────────────────
    let pos = this.root.position.add(this.velocity.scale(dt));
    pos = this.resolveBarrierCollisions(pos, barriers);

    // Pegar el carro a la superficie de la pista (Y interpolada)
    pos.y = proj.closest.y + 0.45;
    this.root.position.copyFrom(pos);

    // ── Fuera de pista ────────────────────────────────────
    const off = Math.abs(proj.lateralDist) > track.halfWidth * OFF_TRACK_MARGIN;
    this.offTrackTimer = off ? this.offTrackTimer + dt : 0;

    if (this.offTrackTimer >= OFF_TRACK_RESET_SEC) {
      const t = proj.tangent.clone(); t.y = 0; t.normalize();
      this.root.position.copyFrom(proj.closest.add(new Vector3(0, 0.45, 0)));
      this.yaw = Math.atan2(t.x, t.z);
      this.velocity.setAll(0);
      this.speed *= 0.15;
      this.offTrackTimer = 0;
    }

    // ── Inclinación visual ────────────────────────────────
    const sr = Math.min(1, absSpeed / MAX_SPEED);
    const targetRoll  = -steer * 0.2 * sr * 1.05 + (-Math.sign(steer) * Math.abs(steer) * steerScale * 0.06 * sr);
    // Pitch visual: subida → nariz arriba, bajada → nariz abajo
    const slopePitch  = -this.currentSlope * 0.8;
    const targetPitch = throttle * 0.055 * (0.35 + sr)
                      - (brake + reverse) * 0.07 * (0.4 + sr)
                      + slopePitch;

    this.rollSmoothed  += (targetRoll  - this.rollSmoothed)  * Math.min(1, dt * 11);
    this.pitchSmoothed += (targetPitch - this.pitchSmoothed) * Math.min(1, dt * 9);

    this.syncRotation();
  }

  private resolveBarrierCollisions(pos: Vector3, barriers: readonly OrientedBoxCollider[]): Vector3 {
    let x = pos.x, z = pos.z;
    let vx = this.velocity.x, vz = this.velocity.z;
    let hitAny = false;
    for (let pass = 0; pass < 5; pass++) {
      let moved = false;
      for (const b of barriers) {
        const res = depenetrateCircleOBB(x, z, CAR_RADIUS, b);
        if (!res) continue;
        x = res.x; z = res.z;
        const vn = vx * res.nx + vz * res.nz;
        if (vn < 0) { vx -= 1.65 * vn * res.nx; vz -= 1.65 * vn * res.nz; }
        moved = true;
        hitAny = true;
      }
      if (!moved) break;
    }
    if (hitAny) {
      vx *= 0.82; vz *= 0.82;
      this.velocity.x = vx; this.velocity.z = vz;
      // Al chocar, reducir speed manteniendo el signo
      this.speed = Math.sign(this.speed) * Math.min(Math.abs(this.speed), Math.hypot(vx, vz));
    }
    // Sin colisión: NO tocar this.speed aquí — ya se calculó arriba con signo correcto
    return new Vector3(x, pos.y, z);
  }

  private syncRotation(): void {
    const yawOffset: number = (this.root.metadata as { yawOffset?: number } | null)?.yawOffset ?? Math.PI;
    this.root.rotationQuaternion = null;
    this.root.rotation.y = this.yaw + yawOffset;
    this.root.rotation.x = this.pitchSmoothed;
    this.root.rotation.z = this.rollSmoothed;
  }
}
