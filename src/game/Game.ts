import {
  DefaultRenderingPipeline,
  Engine,
  FreeCamera,
  HemisphericLight,
  Scene,
  SSAO2RenderingPipeline,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { RACE_LAPS } from "./config";
import { ArcadeCar, type DriveInput } from "./ArcadeCar";
import { createCarRoot, getCarMeshes, type CarStyleId } from "./carVisuals";
import { setupEnvironment } from "./environment";
import { RaceTrack } from "./track";
import { loadTrackModel } from "./trackModel";
import { AudioManager } from "./AudioManager";
import type { NetworkManager } from "../lobby/network";

const COUNTDOWN_STEP_SEC = 0.7;
const GO_DURATION_SEC    = 0.45;

// Intervalo de envío de estado de red (ms)
const NET_SEND_INTERVAL = 50; // 20 Hz

interface RemoteCar {
  root: TransformNode;
  car: ArcadeCar;
  lastX: number; lastY: number; lastZ: number;
  lastYaw: number;
}

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly camera: FreeCamera;
  private readonly track: RaceTrack;
  private readonly car: ArcadeCar;

  // ── Detección de meta por plano ───────────────────────────────
  // En lugar de usar s (posición normalizada en el spline), usamos el signo
  // del producto punto del vector (carPos - metaPos) con la normal del plano
  // de la meta. Cuando el signo pasa de negativo a positivo el carro cruzó
  // en dirección correcta, independientemente del lado de la pista por donde pase.
  private finishLinePos!: Vector3;    // posición de la meta en el mundo
  private finishLineNormal!: Vector3; // normal del plano (apunta hacia adelante en la pista)
  private prevFinishSide = 0;         // signo del frame anterior (-1 o +1)

  private lapCooldown = 0;
  private completedLaps = 0;
  private raceFinished = false;
  private hasPassedMidpoint = false;  // evita vuelta falsa al inicio
  private camYaw = 0;
  private camMode: "follow" | "top" | "left" | "right" = "follow";
  private keys = new Set<string>();
  private phase: "countdown" | "race" = "countdown";
  private countdownElapsed = 0;
  private paused = false;

  // Minimapa
  private minimapCtx: CanvasRenderingContext2D | null = null;
  private minimapTrackImage: ImageData | null = null;
  private minimapScale = 1;
  private minimapOffX = 0;
  private minimapOffZ = 0;

  // Multijugador
  private readonly network: NetworkManager | null;
  private remoteCars: Map<string, RemoteCar> = new Map();
  private netSendAccum = 0;

  // Leaderboard y tiempos
  private raceStartTime = 0;
  private lapStartTime  = 0;
  private bestLapTime   = Infinity;
  private lastLapTime   = 0;
  private lapTimes: number[] = [];
  // Posición de cada jugador en el spline (s 0..1) para el leaderboard
  private remoteProgress: Map<string, { s: number; laps: number; name: string }> = new Map();

  // Audio
  private readonly audio: AudioManager;

  // Velocímetro canvas
  private speedoCtx: CanvasRenderingContext2D | null = null;
  private speedoDialImage: ImageData | null = null; // fondo estático pre-renderizado

  constructor(
    canvas: HTMLCanvasElement,
    carStyle: CarStyleId,
    _playerName: string,
    network: NetworkManager | null,
  ) {
    this.network = network;
    this.audio   = new AudioManager();

    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    this.scene = new Scene(this.engine);

    // ── Pantalla de carga ─────────────────────────────────
    this.showLoadingScreen(true);

    const light = new HemisphericLight("hemi", new Vector3(0.25, 1, 0.2), this.scene);
    const { shadows } = setupEnvironment(this.scene, light);

    this.track = new RaceTrack(this.scene, 13);
    loadTrackModel(this.scene);
    this.initMinimap();
    this.initSpeedo();

    const carRoot = createCarRoot(this.scene, carStyle);
    this.car = new ArcadeCar(carRoot);

    // Registrar meshes del carro local en sombras cuando carguen
    const checkLocalCar = setInterval(() => {
      const meshes = getCarMeshes(carRoot);
      if (meshes.length > 0) {
        clearInterval(checkLocalCar);
        for (const mesh of meshes) {
          shadows.addShadowCaster(mesh, true);
          mesh.receiveShadows = true;
        }
      }
    }, 100);

    // Posición de salida
    const s0 = this.track.samples[0]!;
    const s1 = this.track.samples[1]!;
    const t = s1.subtract(s0);
    t.y = 0; t.normalize();
    const yaw = Math.atan2(t.x, t.z);
    const spawn = new Vector3(s0.x, 0.45, s0.z).add(t.scale(-11));
    this.car.resetTo(spawn, yaw);
    void 0 // = this.track.project(spawn).s;
    this.camYaw = yaw;

    // Plano de meta: posición = samples[0], normal = tangente de la pista en ese punto
    this.finishLinePos    = new Vector3(s0.x, 0, s0.z);
    this.finishLineNormal = t.clone(); // ya normalizado, apunta hacia adelante en la pista

    // Lado inicial del carro respecto al plano de meta (spawn está detrás → negativo)
    const spawnVec = spawn.subtract(this.finishLinePos);
    spawnVec.y = 0;
    this.prevFinishSide = Math.sign(
      spawnVec.x * this.finishLineNormal.x + spawnVec.z * this.finishLineNormal.z
    );

    this.camera = new FreeCamera("cam", new Vector3(0, 6, -14), this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    this.camera.inputs.removeByType("FreeCameraMouseInput");
    this.camera.fov = 1.18;

    // Post-processing — diferido 3 frames para no bloquear la carga inicial
    let ppFrames = 0;
    const ppObserver = this.scene.onAfterRenderObservable.add(() => {
      ppFrames++;
      if (ppFrames < 3) return;
      ppObserver?.remove();

      const pipeline = new DefaultRenderingPipeline("pp", true, this.scene, [this.camera]);
      pipeline.bloomEnabled   = true;
      pipeline.bloomThreshold = 0.95;
      pipeline.bloomWeight    = 0.15;
      pipeline.bloomKernel    = 32;
      pipeline.bloomScale     = 0.3;
      pipeline.imageProcessingEnabled = true;
      pipeline.imageProcessing.toneMappingEnabled = true;
      pipeline.imageProcessing.toneMappingType    = 1;
      pipeline.imageProcessing.exposure           = 1.0;
      pipeline.imageProcessing.contrast           = 1.05;
      pipeline.imageProcessing.colorCurvesEnabled = false;
      pipeline.imageProcessing.vignetteEnabled    = false;
      pipeline.grainEnabled                       = false;
      pipeline.sharpenEnabled                     = true;
      pipeline.sharpen.edgeAmount                 = 0.30;
      pipeline.sharpen.colorAmount                = 1.0;
      pipeline.chromaticAberrationEnabled         = false;
      pipeline.depthOfFieldEnabled                = false;

      // SSAO diferido — se inicializa después del post-processing
      setTimeout(() => {
        const ssao = new SSAO2RenderingPipeline("ssao", this.scene, {
          ssaoRatio: 0.5,
          blurRatio: 0.5,
        }, [this.camera]);
        ssao.radius        = 2.0;
        ssao.totalStrength = 0.8;
        ssao.base          = 0.15;
        ssao.maxZ          = 200;
        ssao.minZAspect    = 0.25;
        ssao.samples       = 4;
        ssao.textureSamples = 1;
      }, 500);

      // Ocultar pantalla de carga cuando el primer frame con post-processing esté listo
      this.showLoadingScreen(false);
    });

    // ── Red: registrar callbacks de estado ────────────────
    if (this.network) {
      this.network.setCallbacks({
        onState: (msg) => this.handleRemoteState(msg),
        onWin: (_id, name) => {
          if (!this.raceFinished) this.showWinner(`${name} GANÓ 🏆`);
        },
        onRosterUpdate: (players) => {
          const localId = this.network!.localPlayer?.id ?? "";
          for (const p of players) {
            if (p.id === localId) continue;
            if (!this.remoteCars.has(p.id)) {
              this.spawnRemoteCar(p.id, p.carStyle as CarStyleId);
            }
          }
          for (const [id] of this.remoteCars) {
            if (!players.find((p) => p.id === id)) {
              this.despawnRemoteCar(id);
            }
          }
        },
      });
      // Disparar roster inicial — los jugadores ya conectados antes de que
      // el Game se creara no dispararán onRosterUpdate de nuevo
      const localId = this.network.localPlayer?.id ?? "";
      for (const p of this.network.players) {
        if (p.id === localId) continue;
        if (!this.remoteCars.has(p.id)) {
          this.spawnRemoteCar(p.id, p.carStyle as CarStyleId);
        }
      }
    }

    // ── Teclado ───────────────────────────────────────────
    window.addEventListener("keydown", (e) => {
      this.audio.resume(); // desbloquear AudioContext en primer input
      this.keys.add(e.code);
      if (e.code === "Digit1") this.camMode = "follow";
      if (e.code === "Digit2") this.camMode = "top";
      if (e.code === "Digit3") this.camMode = "left";
      if (e.code === "Digit4") this.camMode = "right";
      if (e.code === "Escape") this.togglePause();
    });

    // Botones del menú de pausa
    document.getElementById("pause-resume")?.addEventListener("click", () => this.togglePause());
    document.getElementById("pause-lobby")?.addEventListener("click", () => this.returnToLobby());
    window.addEventListener("keyup", (e) => { this.keys.delete(e.code); });

    this.showCountdownOverlay(true);
    this.syncCountdownUi(0);

    this.engine.runRenderLoop(() => {
      const dt = Math.min(this.engine.getDeltaTime() / 1000, 0.05);
      this.updateFrame(dt);
      this.scene.render();
    });

    window.addEventListener("resize", () => { this.engine.resize(); });
  }

  // ── Autos remotos ─────────────────────────────────────────────

  private spawnRemoteCar(id: string, carStyle: CarStyleId): void {
    const root = createCarRoot(this.scene, carStyle);
    const car  = new ArcadeCar(root);
    const s0   = this.track.samples[0]!;
    // Spawn al lado de la línea de meta, separado del jugador local
    const spawnPos = new Vector3(s0.x + 5, 0.45, s0.z);
    car.resetTo(spawnPos, 0);

    // Registrar meshes en shadow generator cuando carguen
    // Los modelos GLTF cargan asíncrono — observar cuando aparezcan hijos
    const checkMeshes = setInterval(() => {
      const meshes = getCarMeshes(root);
      if (meshes.length > 0) {
        clearInterval(checkMeshes);
        for (const mesh of meshes) {
          mesh.receiveShadows = true;
        }
      }
    }, 200);

    this.remoteCars.set(id, {
      root, car,
      lastX: spawnPos.x, lastY: spawnPos.y, lastZ: spawnPos.z,
      lastYaw: 0,
    });
  }

  private despawnRemoteCar(id: string): void {
    const rc = this.remoteCars.get(id);
    if (rc) {
      rc.root.getChildMeshes().forEach((m) => m.dispose());
      rc.root.dispose();
      this.remoteCars.delete(id);
    }
  }

  private handleRemoteState(msg: { playerId: string; x: number; y: number; z: number; yaw: number }): void {
    const rc = this.remoteCars.get(msg.playerId);
    if (!rc) return;

    rc.lastX = msg.x; rc.lastY = msg.y; rc.lastZ = msg.z; rc.lastYaw = msg.yaw;

    // Mover posición y sincronizar rotación visual a través del ArcadeCar
    rc.car.teleportTo(new Vector3(msg.x, msg.y, msg.z), msg.yaw);

    // Actualizar progreso para el leaderboard
    const proj = this.track.project(new Vector3(msg.x, msg.y, msg.z));
    const existing = this.remoteProgress.get(msg.playerId);
    const name = this.network?.players.find(p => p.id === msg.playerId)?.name ?? "Rival";
    this.remoteProgress.set(msg.playerId, {
      s: proj.s,
      laps: existing?.laps ?? 0,
      name,
    });
  }

  // ── Loop principal ────────────────────────────────────────────

  private readInput(): DriveInput {
    let throttle = 0, brake = 0, reverse = 0, steer = 0;
    const spaceHeld = this.keys.has("Space");
    const wHeld     = this.keys.has("KeyW") || this.keys.has("ArrowUp");

    if (wHeld)                                                    throttle = 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown"))      reverse  = 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft"))      steer   -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight"))     steer   += 1;

    // Launch control: espacio + W mientras el carro está parado
    const launchControl = spaceHeld && wHeld && Math.abs(this.car.speed) < 2;

    // Freno normal: espacio SIN launch control activo
    if (spaceHeld && !launchControl) brake = 1;

    return { throttle, brake, steer, reverse, launchControl };
  }

  private updateFrame(dt: number): void {
    if (this.paused) return;

    if (this.phase === "countdown") {
      this.countdownElapsed += dt;
      this.syncCountdownUi(this.countdownElapsed);
      this.car.idleVisuals(dt);
      this.updateCameraFollow();
      // Mantener prevS actualizado durante el countdown para que al iniciar
      // la carrera no haya un salto falso de s > 0.85 → s < 0.15
      void 0 // = this.track.project(this.car.root.position).s;
      
      // IMPORTANTE: Enviar estado también durante countdown para que los jugadores se vean
      if (this.network) {
        this.netSendAccum += dt * 1000;
        if (this.netSendAccum >= NET_SEND_INTERVAL) {
          this.netSendAccum = 0;
          const p = this.car.root.position;
          this.network.sendState(p.x, p.y, p.z, this.car.yaw, this.car.speed);
        }
      }
      
      return;
    }

    if (this.raceFinished) {
      this.updateCameraFollow();
      return;
    }

    const input = this.readInput();
    this.car.update(dt, input, this.track, this.track.barrierColliders);

    // Actualizar audio del motor y llantas
    const absSpd = Math.abs(this.car.speed);
    const { gear, rpmNorm } = this.audio.updateEngine(this.car.speed, input.throttle, input.brake > 0.5);
    const squealing = (input.brake > 0.5 && absSpd > 15)
                   || (Math.abs(input.steer) > 0.7 && absSpd > 20);
    if (squealing) this.audio.startTireSqueal();
    else           this.audio.stopTireSqueal();

    // Enviar estado de red
    if (this.network) {
      this.netSendAccum += dt * 1000;
      if (this.netSendAccum >= NET_SEND_INTERVAL) {
        this.netSendAccum = 0;
        const p = this.car.root.position;
        this.network.sendState(p.x, p.y, p.z, this.car.yaw, this.car.speed);
      }
    }

    const proj = this.track.project(this.car.root.position);

    if (this.lapCooldown > 0) this.lapCooldown -= dt;

    // hasPassedMidpoint: el carro pasó por la recta trasera (zona opuesta a la meta)
    const carX = this.car.root.position.x;
    const carZ = this.car.root.position.z;
    if (carZ > 80 && carZ < 220 && carX > -450 && carX < 450) {
      this.hasPassedMidpoint = true;
    }

    const speed = this.car.speed;

    // ── Detección de cruce de meta por distancia directa ──────
    // Usamos distancia al punto de meta en lugar del plano para mayor precisión.
    // El carro cruza cuando pasa de estar "detrás" a "delante" del punto de meta,
    // medido como el producto punto con la normal de la pista en ese punto.
    const carPos = this.car.root.position;
    const toCarX = carPos.x - this.finishLinePos.x;
    const toCarZ = carPos.z - this.finishLinePos.z;
    // Distancia lateral al eje de la pista — solo contar si está dentro de la pista
    const lateralDist = Math.abs(
      toCarX * (-this.finishLineNormal.z) + toCarZ * this.finishLineNormal.x
    );
    const dot = toCarX * this.finishLineNormal.x + toCarZ * this.finishLineNormal.z;
    const currentSide = Math.sign(dot);

    // Solo contar si el carro está dentro del ancho de la pista (±halfWidth)
    const withinTrackWidth = lateralDist < this.track.halfWidth * 1.5;

    const crossed = this.lapCooldown <= 0
      && speed > 2.2
      && this.prevFinishSide < 0       // venía del lado de atrás
      && currentSide > 0               // ahora está del lado de adelante
      && this.hasPassedMidpoint        // completó al menos medio circuito
      && withinTrackWidth;             // está dentro del ancho de la pista

    this.prevFinishSide = currentSide !== 0 ? currentSide : this.prevFinishSide;

    if (crossed) {
      this.completedLaps++;
      this.lapCooldown = 2.2;
      this.hasPassedMidpoint = false;

      // Registrar tiempo de vuelta
      const now = performance.now();
      this.lastLapTime = (now - this.lapStartTime) / 1000;
      this.lapTimes.push(this.lastLapTime);
      if (this.lastLapTime < this.bestLapTime) this.bestLapTime = this.lastLapTime;
      this.lapStartTime = now;

      if (this.completedLaps >= RACE_LAPS) {
        this.raceFinished = true;
        if (this.network) this.network.sendWin();
        this.showWinner("¡TÚ GANASTE! 🏆");
        this.audio.stopRaceMusic();
        this.audio.playVictory();
      } else {
        this.audio.playLapComplete();
      }
    }

    void 0 // = s;
    this.updateCameraFollow();
    this.updateHud(speed, crossed, proj.s, gear, rpmNorm);
    this.updateLeaderboard(proj.s);
    this.updateMinimap();
  }

  // ── Cuenta atrás ──────────────────────────────────────────────

  private syncCountdownUi(t: number): void {
    const textEl  = document.getElementById("countdown-text");
    const totalGo = 3 * COUNTDOWN_STEP_SEC + GO_DURATION_SEC;

    if      (t < COUNTDOWN_STEP_SEC)     {
      textEl?.setAttribute("data-n", "3"); if (textEl) textEl.textContent = "3";
      this.audio.tickCountdown(0);
    }
    else if (t < 2 * COUNTDOWN_STEP_SEC) {
      textEl?.setAttribute("data-n", "2"); if (textEl) textEl.textContent = "2";
      this.audio.tickCountdown(1);
    }
    else if (t < 3 * COUNTDOWN_STEP_SEC) {
      textEl?.setAttribute("data-n", "1"); if (textEl) textEl.textContent = "1";
      this.audio.tickCountdown(2);
    }
    else if (t < totalGo)                {
      textEl?.setAttribute("data-n", "go"); if (textEl) textEl.textContent = "¡YA!";
      this.audio.tickCountdown(3);
    }
    else {
      this.phase = "race";
      this.showCountdownOverlay(false);
      void 0 // = this.track.project(this.car.root.position).s;
      // Cooldown inicial: evita contar vuelta falsa justo al arrancar.
      this.lapCooldown = 12.0;
      this.hasPassedMidpoint = false;
      // Arrancar motor y música
      this.audio.startEngine();
      this.audio.startRaceMusic();
      // Iniciar timers
      this.raceStartTime = performance.now();
      this.lapStartTime  = performance.now();
    }
  }

  private showCountdownOverlay(show: boolean): void {
    document.getElementById("countdown-overlay")?.classList.toggle("hidden", !show);
  }

  private showLoadingScreen(show: boolean): void {
    let el = document.getElementById("loading-screen");
    if (!el && show) {
      el = document.createElement("div");
      el.id = "loading-screen";
      el.style.cssText = [
        "position:fixed", "inset:0", "z-index:9999",
        "background:#0a0a0f",
        "display:flex", "flex-direction:column",
        "align-items:center", "justify-content:center",
        "font-family:'Orbitron',monospace", "color:#fff",
        "transition:opacity 0.4s ease",
      ].join(";");
      el.innerHTML = `
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.2em;color:#e10600;margin-bottom:1rem">RACEX</div>
        <div style="font-size:0.9rem;color:#aaa;letter-spacing:0.1em;margin-bottom:2rem">CARGANDO...</div>
        <div style="width:220px;height:4px;background:#222;border-radius:2px;overflow:hidden">
          <div id="loading-bar" style="height:100%;width:0%;background:#e10600;border-radius:2px;transition:width 0.3s ease;animation:loadpulse 1.2s ease-in-out infinite"></div>
        </div>
        <style>@keyframes loadpulse{0%,100%{opacity:1}50%{opacity:0.5}}</style>
      `;
      document.body.appendChild(el);
      // Animar la barra de carga
      let pct = 0;
      const bar = el.querySelector("#loading-bar") as HTMLElement | null;
      const anim = setInterval(() => {
        pct = Math.min(95, pct + Math.random() * 12);
        if (bar) bar.style.width = `${pct}%`;
        if (pct >= 95) clearInterval(anim);
      }, 200);
      (el as HTMLElement & { _loadAnim?: ReturnType<typeof setInterval> })._loadAnim = anim;
    }
    if (!show && el) {
      const bar = el.querySelector("#loading-bar") as HTMLElement | null;
      if (bar) bar.style.width = "100%";
      setTimeout(() => {
        (el as HTMLElement).style.opacity = "0";
        setTimeout(() => el?.remove(), 420);
      }, 200);
    }
  }

  private showWinner(msg: string): void {
    this.raceFinished = true;
    const el = document.getElementById("finish-title");
    const sub = document.getElementById("finish-sub");
    const overlay = document.getElementById("finish-overlay");
    if (el) el.textContent = msg;
    if (sub) {
      const totalSec = (performance.now() - this.raceStartTime) / 1000;
      const best = this.bestLapTime < Infinity ? this.fmtTime(this.bestLapTime) : "--:--";
      const lines = [
        `Tiempo total: ${this.fmtTime(totalSec)}`,
        `Mejor vuelta: ${best}`,
        `Vueltas: ${this.lapTimes.map((t, i) => `V${i + 1} ${this.fmtTime(t)}`).join("  ")}`,
        `Recarga la página para repetir`,
      ];
      sub.innerHTML = lines.join("<br>");
    }
    overlay?.classList.add("visible");
  }

  private fmtTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
  }

  private updateLeaderboard(localS: number): void {
    const el = document.getElementById("hud-leaderboard");
    if (!el) return;

    // Construir lista de jugadores con su progreso
    const localName = this.network?.localPlayer?.name ?? "Tú";
    const localTotal = this.completedLaps + localS;

    const entries: { name: string; total: number; laps: number }[] = [
      { name: localName, total: localTotal, laps: this.completedLaps },
    ];

    for (const [, prog] of this.remoteProgress) {
      entries.push({ name: prog.name, total: prog.laps + prog.s, laps: prog.laps });
    }

    // Ordenar por progreso total (vueltas + fracción de vuelta actual)
    entries.sort((a, b) => b.total - a.total);

    // Tiempo de carrera actual
    const elapsed = this.phase === "race"
      ? (performance.now() - this.raceStartTime) / 1000
      : 0;

    const lines: string[] = [];
    if (this.phase === "race" && !this.raceFinished) {
      lines.push(`⏱ ${this.fmtTime(elapsed)}`);
      if (this.lastLapTime > 0) lines.push(`Última: ${this.fmtTime(this.lastLapTime)}`);
    }

    entries.forEach((e, i) => {
      const isLocal = e.name === localName;
      const pos = ["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`;
      const lap = `V${e.laps + 1}/${RACE_LAPS}`;
      lines.push(`${pos} ${isLocal ? "▶ " : ""}${e.name}  ${lap}`);
    });

    el.innerHTML = lines.join("<br>");
  }

  private togglePause(): void {
    // No pausar durante el countdown
    if (this.phase === "countdown") return;
    this.paused = !this.paused;
    document.getElementById("pause-overlay")?.classList.toggle("hidden", !this.paused);
  }

  private returnToLobby(): void {
    this.dispose();
    // Mostrar el overlay del lobby y recargar la página para reiniciar limpio
    window.location.reload();
  }

  // ── Cámara ────────────────────────────────────────────────────

  private updateCameraFollow(): void {
    const p      = this.car.root.position;
    const carYaw = this.car.yaw;

    if (this.camMode === "top") {
      this.camera.position.set(50, 85, -50);
      this.camera.setTarget(new Vector3(50, 0, -50));
      return;
    }
    if (this.camMode === "left") {
      const left = new Vector3(-Math.cos(carYaw), 0, Math.sin(carYaw));
      this.camera.position.copyFrom(p.add(left.scale(18)).add(new Vector3(0, 4, 0)));
      this.camera.setTarget(p.add(new Vector3(0, 1, 0)));
      return;
    }
    if (this.camMode === "right") {
      const right = new Vector3(Math.cos(carYaw), 0, -Math.sin(carYaw));
      this.camera.position.copyFrom(p.add(right.scale(18)).add(new Vector3(0, 4, 0)));
      this.camera.setTarget(p.add(new Vector3(0, 1, 0)));
      return;
    }

    // Follow con lag
    let diff = carYaw - this.camYaw;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.camYaw += diff * 0.08;

    const forward = new Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw));
    const eye = p.add(forward.scale(-9.0)).add(new Vector3(0, 2.4, 0));
    this.camera.position.copyFrom(eye);
    this.camera.setTarget(p.add(new Vector3(0, 0.7, 0)));
  }

  // ── HUD ───────────────────────────────────────────────────────

  private updateHud(speed: number, lapTick: boolean, trackS: number, gear = 0, rpmNorm = 0): void {
    const kmh = Math.round(Math.abs(speed) * 3.6);
    const elLap    = document.getElementById("hud-lap");
    const elHint   = document.getElementById("hud-hint");
    const elFill   = document.getElementById("lap-bar-fill");
    const elFinish = document.getElementById("finish-overlay");

    if (elFill) (elFill as HTMLElement).style.width = `${Math.round(trackS * 100)}%`;

    if (elLap) {
      elLap.textContent = this.raceFinished
        ? `✓ ${RACE_LAPS}/${RACE_LAPS} vueltas`
        : `Vuelta ${this.completedLaps + 1} / ${RACE_LAPS}`;
    }

    if (this.raceFinished && elFinish && !elFinish.classList.contains("visible")) {
      elFinish.classList.add("visible");
    }

    if (elHint) {
      if (this.raceFinished) {
        elHint.textContent = "";
      } else if (this.car.launchControlActive) {
        // Mostrar indicador de launch control con barra de RPM
        const bars = Math.round(this.car.launchRpm * 8);
        const bar  = "█".repeat(bars) + "░".repeat(8 - bars);
        elHint.textContent = `🚀 LAUNCH CONTROL [${bar}]`;
        (elHint as HTMLElement).style.color = "#ff3020";
        (elHint as HTMLElement).style.fontWeight = "bold";
      } else if (lapTick) {
        (elHint as HTMLElement).style.color = "";
        (elHint as HTMLElement).style.fontWeight = "";
        elHint.textContent = "¡Vuelta registrada!";
        const lapEl = document.getElementById("hud-lap");
        lapEl?.classList.remove("lap-flash");
        void lapEl?.offsetWidth;
        lapEl?.classList.add("lap-flash");
        window.setTimeout(() => {
          if (elHint) {
            elHint.textContent = "WASD · Espacio frenar · 1-4 cámara";
            (elHint as HTMLElement).style.color = "";
            (elHint as HTMLElement).style.fontWeight = "";
          }
        }, 900);
      } else if (!this.car.launchControlActive) {
        (elHint as HTMLElement).style.color = "";
        (elHint as HTMLElement).style.fontWeight = "";
      }
    }

    // Actualizar velocímetro
    this.updateSpeedo(kmh, gear, rpmNorm);
  }

  // ── Velocímetro ───────────────────────────────────────────────

  private initSpeedo(): void {
    const canvas = document.getElementById("speedo-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    this.speedoCtx = ctx;

    const S = 220;
    const cx = S / 2, cy = S / 2;
    const R = 96; // radio exterior del dial

    ctx.clearRect(0, 0, S, S);

    // Fondo circular
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bgGrad.addColorStop(0,   "rgba(12, 18, 40, 0.95)");
    bgGrad.addColorStop(0.7, "rgba(8,  12, 28, 0.98)");
    bgGrad.addColorStop(1,   "rgba(4,   6, 16, 1.0)");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Borde exterior
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Arco de fondo del velocímetro (exterior) ──────────────
    // 0 km/h en 210°, 340 km/h en 330° (arco de 120° en la mitad inferior)
    const SPD_START = (210 * Math.PI) / 180;
    const SPD_END   = (330 * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 8, SPD_START, SPD_END);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 7;
    ctx.stroke();

    // ── Arco de fondo del RPM (interior, más pequeño) ─────────
    // Mismo ángulo pero radio menor — se llenará dinámicamente
    const RPM_R = R - 20; // radio del arco RPM
    ctx.beginPath();
    ctx.arc(cx, cy, RPM_R, SPD_START, SPD_END);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 5;
    ctx.stroke();

    // ── Marcas de velocidad ───────────────────────────────────
    const MAX_KMH  = 320;
    const SPD_SPAN = 120; // grados totales del arco de velocidad
    const marks = [0, 60, 100, 140, 190, 240, 280, 320];

    ctx.font = "bold 8px 'Orbitron', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const kmh of marks) {
      const frac = kmh / MAX_KMH;
      const angleDeg = 210 + frac * SPD_SPAN;
      const angleRad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);

      const r1 = R - 8, r2 = R - 17;
      ctx.beginPath();
      ctx.moveTo(cx + cos * r1, cy + sin * r1);
      ctx.lineTo(cx + cos * r2, cy + sin * r2);
      ctx.strokeStyle = kmh >= 280 ? "rgba(225,6,0,0.9)" : "rgba(255,255,255,0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const rText = R - 26;
      ctx.fillStyle = kmh >= 280 ? "rgba(255,100,80,0.9)" : "rgba(200,220,255,0.75)";
      ctx.fillText(String(kmh), cx + cos * rText, cy + sin * rText);
    }

    // Marcas menores cada 10 km/h
    for (let kmh = 0; kmh <= MAX_KMH; kmh += 10) {
      if (marks.includes(kmh)) continue;
      const frac = kmh / MAX_KMH;
      const angleDeg = 210 + frac * SPD_SPAN;
      const angleRad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
      const r1 = R - 8, r2 = kmh % 60 === 0 ? R - 15 : R - 13;
      ctx.beginPath();
      ctx.moveTo(cx + cos * r1, cy + sin * r1);
      ctx.lineTo(cx + cos * r2, cy + sin * r2);
      ctx.strokeStyle = kmh >= 260 ? "rgba(225,6,0,0.5)" : "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Zona roja velocímetro (260-320 km/h)
    const redStart = ((210 + (260 / MAX_KMH) * SPD_SPAN) * Math.PI) / 180;
    const redEnd   = ((210 + SPD_SPAN) * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 11, redStart, redEnd);
    ctx.strokeStyle = "rgba(225,6,0,0.45)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Guardar fondo estático
    this.speedoDialImage = ctx.getImageData(0, 0, S, S);
  }

  // Tiempo acumulado para el parpadeo de redline
  private redlineFlash = 0;

  private updateSpeedo(kmh: number, gear: number, rpmNorm: number): void {
    const ctx = this.speedoCtx;
    if (!ctx || !this.speedoDialImage) return;

    const S = 220;
    const cx = S / 2, cy = S / 2;
    const R = 96;
    const MAX_KMH  = 340;
    const SPD_SPAN = 120; // grados del arco de velocidad
    const RPM_R    = R - 20; // radio del arco RPM

    // Restaurar fondo estático
    ctx.putImageData(this.speedoDialImage, 0, 0);

    const SPD_START_DEG = 210;
    const SPD_START_RAD = (SPD_START_DEG * Math.PI) / 180;
    const SPD_END_RAD   = ((SPD_START_DEG + SPD_SPAN) * Math.PI) / 180;

    // ── Arco de RPM (interior) ────────────────────────────────
    // Verde → amarillo → rojo según rpmNorm (0-1)
    // Parpadea en rojo cuando rpmNorm > 0.88 (redline)
    const isRedline = rpmNorm > 0.88;
    this.redlineFlash += 0.18;
    const flashVisible = !isRedline || Math.sin(this.redlineFlash * Math.PI * 2 * 8) > 0;

    if (rpmNorm > 0.01 && flashVisible) {
      const rpmEndRad = SPD_START_RAD + rpmNorm * (SPD_END_RAD - SPD_START_RAD);

      // Color del arco según RPM
      let rpmColor: string;
      if (rpmNorm < 0.6) {
        // Verde → amarillo
        const t = rpmNorm / 0.6;
        const r = Math.round(t * 255);
        const g = 220;
        rpmColor = `rgba(${r}, ${g}, 40, 0.9)`;
      } else if (rpmNorm < 0.85) {
        // Amarillo → naranja
        const t = (rpmNorm - 0.6) / 0.25;
        const r = 255;
        const g = Math.round(220 - t * 160);
        rpmColor = `rgba(${r}, ${g}, 20, 0.9)`;
      } else {
        // Rojo redline
        rpmColor = isRedline ? "rgba(255, 30, 10, 1.0)" : "rgba(225, 6, 0, 0.9)";
      }

      // Glow en redline
      if (isRedline) {
        ctx.save();
        ctx.shadowColor = "#ff2000";
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.arc(cx, cy, RPM_R, SPD_START_RAD, rpmEndRad);
      ctx.strokeStyle = rpmColor;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.stroke();

      if (isRedline) ctx.restore();

      // Marcas de "shift point" — línea blanca al 88% (punto de cambio)
      const shiftRad = SPD_START_RAD + 0.88 * (SPD_END_RAD - SPD_START_RAD);
      const cos = Math.cos(shiftRad), sin = Math.sin(shiftRad);
      ctx.beginPath();
      ctx.moveTo(cx + cos * (RPM_R - 4), cy + sin * (RPM_R - 4));
      ctx.lineTo(cx + cos * (RPM_R + 4), cy + sin * (RPM_R + 4));
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── Aguja de velocidad ────────────────────────────────────
    const frac = Math.min(1, kmh / MAX_KMH);
    const angleDeg = SPD_START_DEG + frac * SPD_SPAN;
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad), sin = Math.sin(angleRad);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const needleLen  = RPM_R - 6; // llega hasta el arco RPM
    const needleBack = 12;
    ctx.beginPath();
    ctx.moveTo(cx - cos * needleBack, cy - sin * needleBack);
    ctx.lineTo(cx + cos * needleLen,  cy + sin * needleLen);
    ctx.strokeStyle = kmh >= 280 ? "#ff3020" : "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // Centro de la aguja
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#e10600";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // ── DOM: número y marcha ──────────────────────────────────
    const elKmh  = document.getElementById("speedo-kmh");
    const elGear = document.getElementById("speedo-gear");

    if (elKmh) elKmh.textContent = String(kmh);
    if (elGear) {
      elGear.textContent = gear === 0 ? "N" : String(gear);
      (elGear as HTMLElement).style.color = isRedline ? "#ff3020" : gear === 0 ? "#888" : "#e10600";
      (elGear as HTMLElement).style.textShadow = isRedline
        ? "0 0 14px rgba(255,48,32,0.9)"
        : gear === 0 ? "none" : "0 0 8px rgba(225,6,0,0.6)";
    }

    // Ocultar la barra DOM de RPM (ya no se usa, el arco canvas la reemplaza)
    const elRpmWrap = document.getElementById("speedo-rpm-wrap");
    if (elRpmWrap) (elRpmWrap as HTMLElement).style.display = "none";
  }

  // ── Minimapa ──────────────────────────────────────────────────

  private initMinimap(): void {
    const canvas = document.getElementById("minimap-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    this.minimapCtx = ctx;

    const SIZE = 160;
    const PAD  = 12;
    const samples = this.track.samples;

    // Calcular bounding box del circuito en XZ
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const s of samples) {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.z < minZ) minZ = s.z;
      if (s.z > maxZ) maxZ = s.z;
    }

    const rangeX = maxX - minX;
    const rangeZ = maxZ - minZ;
    const scale  = (SIZE - PAD * 2) / Math.max(rangeX, rangeZ);
    this.minimapScale = scale;
    // Centrar en el canvas
    // Nota: invertimos Z para que el norte del mundo quede arriba en el minimapa
    // (en canvas 2D el eje Y crece hacia abajo, en BabylonJS Z crece hacia el norte)
    this.minimapOffX = PAD + ((SIZE - PAD * 2) - rangeX * scale) / 2 - minX * scale;
    this.minimapOffZ = PAD + ((SIZE - PAD * 2) - rangeZ * scale) / 2 + maxZ * scale;

    // Dibujar la pista (línea de fondo) — se guarda como ImageData para no redibujar cada frame
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Sombra de la pista
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth   = 7;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]!;
      const x = s.x * scale + this.minimapOffX;
      const z = -s.z * scale + this.minimapOffZ;
      if (i === 0) ctx.moveTo(x, z); else ctx.lineTo(x, z);
    }
    ctx.closePath();
    ctx.stroke();

    // Pista blanca
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth   = 4;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]!;
      const x = s.x * scale + this.minimapOffX;
      const z = -s.z * scale + this.minimapOffZ;
      if (i === 0) ctx.moveTo(x, z); else ctx.lineTo(x, z);
    }
    ctx.closePath();
    ctx.stroke();

    // Línea de meta (rojo)
    const s0 = samples[0]!;
    const s1 = samples[1]!;
    const mx = s0.x * scale + this.minimapOffX;
    const mz = -s0.z * scale + this.minimapOffZ;
    const tx = (s1.x - s0.x), tz = -(s1.z - s0.z);
    const len = Math.hypot(tx, tz);
    const nx = -tz / len * 5, nz = tx / len * 5;
    ctx.strokeStyle = "#e10600";
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(mx - nx, mz - nz);
    ctx.lineTo(mx + nx, mz + nz);
    ctx.stroke();

    // Guardar imagen base para restaurar cada frame
    this.minimapTrackImage = ctx.getImageData(0, 0, SIZE, SIZE);
  }

  private updateMinimap(): void {
    const ctx = this.minimapCtx;
    if (!ctx || !this.minimapTrackImage) return;

    const SIZE = 160;
    // Restaurar imagen base (pista sin el punto del coche)
    ctx.putImageData(this.minimapTrackImage, 0, 0);

    // Posición del coche local
    const pos = this.car.root.position;
    const cx  = pos.x * this.minimapScale + this.minimapOffX;
    const cz  = -pos.z * this.minimapScale + this.minimapOffZ;

    // Punto del coche — círculo con borde
    ctx.beginPath();
    ctx.arc(cx, cz, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#e10600";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Puntos de coches remotos (azul)
    for (const [, rc] of this.remoteCars) {
      const rp = rc.root.position;
      const rx = rp.x * this.minimapScale + this.minimapOffX;
      const rz = -rp.z * this.minimapScale + this.minimapOffZ;
      if (rx < 0 || rx > SIZE || rz < 0 || rz > SIZE) continue;
      ctx.beginPath();
      ctx.arc(rx, rz, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#4488ff";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  dispose(): void {
    this.audio.dispose();
    this.network?.disconnect();
    this.scene.dispose();
    this.engine.dispose();
  }
}
