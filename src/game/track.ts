import {
  Color3,
  Curve3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from "@babylonjs/core";
import type { OrientedBoxCollider } from "./barrierCollision";

export type TrackProjection = {
  closest: Vector3;
  tangent: Vector3;
  /** Pendiente de la pista en este punto (-1 bajada fuerte, +1 subida fuerte) */
  slope: number;
  s: number;
  lateralDist: number;
};

export class RaceTrack {
  readonly samples: Vector3[] = [];
  readonly totalLength: number;
  readonly halfWidth: number;
  readonly barrierColliders: OrientedBoxCollider[] = [];
  private readonly segmentLengths: number[] = [];
  private readonly distAtSample: number[] = [];

  constructor(
    private readonly scene: Scene,
    halfWidth = 14,
  ) {
    this.halfWidth = halfWidth;

    /**
     * CIRCUITO EXTENDIDO SIN CRUCES — ~12 km (aprox. 2 minutos por vuelta)
     *
     * Diseño tipo óvalo extendido con sectores técnicos
     * SIN CRUCES - La pista nunca se cruza consigo misma
     * 
     * Layout: Óvalo grande con extensiones laterales
     *  - Recta principal (meta)
     *  - Sector Este (curvas rápidas)
     *  - Recta trasera larga
     *  - Sector Oeste (curvas técnicas)
     *  - Regreso a meta
     *
     * Orientación: recta principal corre en dirección -Z.
     * XZ spread: X ≈ -500..+500, Z ≈ -700..+200
     */
    const control: Vector3[] = [
      // ══════════════════════════════════════════════════════════
      // LÍNEA DE META Y RECTA PRINCIPAL
      // ══════════════════════════════════════════════════════════
      new Vector3(   0, 0,    0),   // ★ LÍNEA DE META ★
      new Vector3(   0, 0,  -80),   // recta principal
      new Vector3(   0, 0, -160),   // recta principal
      new Vector3(   0, 0, -240),   // final recta principal
      new Vector3(   0, 0, -310),   // frenada

      // ══════════════════════════════════════════════════════════
      // SECTOR ESTE - CURVAS RÁPIDAS (giro a la derecha)
      // ══════════════════════════════════════════════════════════
      new Vector3(  40, 0, -370),   // entrada curva 1
      new Vector3( 100, 0, -420),   // curva 1 apex
      new Vector3( 180, 0, -460),   // curva 1 salida
      new Vector3( 270, 0, -480),   // recta intermedia
      new Vector3( 360, 0, -480),   // curva 2 entrada
      new Vector3( 430, 0, -450),   // curva 2 apex
      new Vector3( 480, 0, -400),   // curva 2 salida
      
      // Chicane rápida
      new Vector3( 500, 0, -330),   // chicane izq
      new Vector3( 480, 0, -270),   // chicane der
      new Vector3( 500, 0, -210),   // chicane salida
      
      // Curva larga derecha
      new Vector3( 500, 0, -130),   // curva 3 entrada
      new Vector3( 480, 0,  -50),   // curva 3 apex
      new Vector3( 440, 0,   20),   // curva 3 mid
      new Vector3( 380, 0,   80),   // curva 3 salida

      // ══════════════════════════════════════════════════════════
      // RECTA TRASERA LARGA (la más larga del circuito)
      // ══════════════════════════════════════════════════════════
      new Vector3( 300, 0,  120),   // inicio recta trasera
      new Vector3( 200, 0,  150),   // recta trasera
      new Vector3(  80, 0,  170),   // recta trasera
      new Vector3( -60, 0,  180),   // recta trasera
      new Vector3(-200, 0,  180),   // recta trasera
      new Vector3(-320, 0,  170),   // recta trasera
      new Vector3(-420, 0,  140),   // final recta trasera
      new Vector3(-480, 0,   90),   // frenada

      // ══════════════════════════════════════════════════════════
      // SECTOR OESTE - CURVAS TÉCNICAS (giro a la izquierda)
      // ══════════════════════════════════════════════════════════
      new Vector3(-500, 0,   20),   // horquilla entrada
      new Vector3(-490, 0,  -50),   // horquilla apex
      new Vector3(-460, 0, -110),   // horquilla salida
      
      // Esses (curvas en S)
      new Vector3(-410, 0, -170),   // S izquierda
      new Vector3(-380, 0, -220),   // S centro
      new Vector3(-410, 0, -270),   // S derecha
      new Vector3(-380, 0, -320),   // S salida
      
      // Curva rápida izquierda
      new Vector3(-320, 0, -380),   // curva 4 entrada
      new Vector3(-240, 0, -430),   // curva 4 apex
      new Vector3(-150, 0, -460),   // curva 4 salida

      // ══════════════════════════════════════════════════════════
      // SECTOR FINAL - REGRESO A META
      // ══════════════════════════════════════════════════════════
      new Vector3( -60, 0, -470),   // recta intermedia
      new Vector3(  30, 0, -460),   // chicane final entrada
      new Vector3(  60, 0, -440),   // chicane final apex
      new Vector3(  40, 0, -410),   // chicane final salida
      
      // Curva parabolica final (regreso a meta)
      new Vector3(   0, 0, -370),   // parabolica entrada
      new Vector3( -50, 0, -320),   // parabolica apex 1
      new Vector3( -80, 0, -260),   // parabolica mid
      new Vector3( -90, 0, -190),   // parabolica apex 2
      new Vector3( -80, 0, -120),   // parabolica salida
      new Vector3( -60, 0,  -60),   // aceleración final
      new Vector3( -30, 0,  -20),   // casi meta
      new Vector3( -10, 0,    0),   // entrada a meta
    ];

    const curve = Curve3.CreateCatmullRomSpline(control, 80, true); // Más puntos para suavidad
    this.samples = curve.getPoints();
    const n = this.samples.length;

    let acc = 0;
    this.distAtSample.push(0);
    for (let i = 0; i < n; i++) {
      const a = this.samples[i]!;
      const b = this.samples[(i + 1) % n]!;
      const len = Vector3.Distance(
        new Vector3(a.x, 0, a.z),
        new Vector3(b.x, 0, b.z),
      );
      this.segmentLengths.push(len);
      acc += len;
      this.distAtSample.push(acc);
    }
    this.totalLength = acc;

    this.buildRibbonMesh();
    this.buildGrass();
    this.buildEdgeLines();
    this.buildCenterDashes();
    this.buildCurbs();
    this.buildMarkings();
  }

  private buildRibbonMesh(): void {
    const n = this.samples.length;
    const pathArr: Vector3[] = [];
    const path2: Vector3[] = [];

    for (let i = 0; i < n; i++) {
      const { center, side } = this.getFrameAt(i);
      const scaled = side.scale(this.halfWidth);
      pathArr.push(center.add(scaled));
      path2.push(center.subtract(scaled));
    }

    const ribbon = MeshBuilder.CreateRibbon("trackAsphalt",
      { pathArray: [pathArr, path2], closeArray: true, closePath: true },
      this.scene);

    // ── Material PBR NATURAL para asfalto ─────────────────────
    const mat = new PBRMaterial("trackMat", this.scene);
    
    // Albedo (color base) - asfalto gris oscuro natural
    const albedo = new Texture("/assets/textures/asphalt/color.jpg", this.scene);
    albedo.uScale = 20; albedo.vScale = 20;
    mat.albedoTexture = albedo;
    
    // Normal map para relieve
    const normal = new Texture("/assets/textures/asphalt/normal.jpg", this.scene);
    normal.uScale = 20; normal.vScale = 20;
    mat.bumpTexture = normal;
    mat.invertNormalMapY = false;
    mat.bumpTexture.level = 1.0; // Normal
    
    // Roughness - asfalto es rugoso
    const rough = new Texture("/assets/textures/asphalt/roughness.jpg", this.scene);
    rough.uScale = 20; rough.vScale = 20;
    mat.metallicTexture = rough;
    mat.useRoughnessFromMetallicTextureGreen = true;
    mat.useRoughnessFromMetallicTextureAlpha = false;
    mat.metallic = 0.0;
    mat.roughness = 0.90; // Rugoso pero no extremo
    
    // Ambient Occlusion
    mat.ambientTexture = rough;
    mat.useAmbientInGrayScale = true;
    mat.ambientTextureStrength = 0.5;
    
    // Propiedades físicas NATURALES
    mat.directIntensity = 1.0;
    mat.environmentIntensity = 0.5;
    mat.specularIntensity = 0.05;
    
    // Usar PBR estándar
    mat.usePhysicalLightFalloff = true;
    mat.useRadianceOverAlpha = true;
    
    ribbon.material = mat;
    ribbon.receiveShadows = true;
  }

  private buildGrass(): void {
    const ground = MeshBuilder.CreateGround("grass",
      { width: 1800, height: 1800, subdivisions: 16 }, this.scene);
    ground.position.y = -0.05;

    // ── Material VERDE VIVO para césped ───────────────────────
    const mat = new PBRMaterial("grassMat", this.scene);
    
    // Textura de césped con rayas
    const grassTex = this.generateRealisticGrassTexture();
    mat.albedoTexture = grassTex;
    
    // Propiedades físicas
    mat.metallic = 0.0;
    mat.roughness = 0.92;
    mat.directIntensity = 0.8; // REDUCIDO para que no se queme
    mat.environmentIntensity = 0.4; // REDUCIDO
    
    // Color base VERDE INTENSO
    mat.albedoColor = new Color3(0.20, 0.50, 0.18); // Verde césped natural
    
    // SIN emissive (estaba haciendo que se vea blanco)
    mat.emissiveColor = new Color3(0, 0, 0);
    mat.emissiveIntensity = 0;
    
    // SIN subsurface (estaba haciendo que se vea blanco)
    mat.subSurface.isTranslucencyEnabled = false;
    
    ground.material = mat;
    ground.receiveShadows = true;
  }

  /** Genera textura de césped simple y rápida */
  private generateRealisticGrassTexture(): Texture {
    const TS = 256; // Resolución reducida — suficiente para césped
    const tex = new DynamicTexture("grassTex", { width: TS, height: TS }, this.scene, false);
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    const ctx = tex.getContext() as CanvasRenderingContext2D;

    // Base verde sólida
    ctx.fillStyle = "#2d6b22";
    ctx.fillRect(0, 0, TS, TS);

    // Rayas de corte de césped
    for (let y = 0; y < TS; y += 16) {
      ctx.fillStyle = y % 32 === 0 ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.08)";
      ctx.fillRect(0, y, TS, 16);
    }

    // Variación de color en bloques (rápido, sin pixel-by-pixel)
    const colors = ["#2a6520", "#2f7024", "#286018", "#316c26", "#2b6721"];
    for (let y = 0; y < TS; y += 32) {
      for (let x = 0; x < TS; x += 32) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]!;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, y, 32, 32);
      }
    }
    ctx.globalAlpha = 1.0;

    tex.update();
    return tex;
  }

  private buildEdgeLines(): void { /* eliminadas */ }

  private buildCenterDashes(): void {
    const mat = new StandardMaterial("dashWhite", this.scene);
    mat.diffuseColor = new Color3(0.95, 0.95, 0.95);
    mat.emissiveColor = new Color3(0.06, 0.06, 0.06);
    const n = this.samples.length;
    const meshes: Mesh[] = [];
    for (let i = 0; i < n; i += 16) {
      const { center, tangent } = this.getFrameAt(i);
      const m = MeshBuilder.CreateBox(`_d_${i}`,
        { width: 0.22, height: 0.03, depth: 1.4 }, this.scene);
      m.position = center.add(new Vector3(0, 0.06, 0));
      m.rotation.y = Math.atan2(tangent.x, tangent.z);
      meshes.push(m);
    }
    if (meshes.length) {
      const merged = Mesh.MergeMeshes(meshes, true, true);
      if (merged) merged.material = mat;
    }
  }

  private buildCurbs(): void {
    const matRed = new PBRMaterial("curbR", this.scene);
    matRed.albedoColor = new Color3(0.90, 0.06, 0.04);
    matRed.metallic = 0.0; matRed.roughness = 0.55;
    
    const matWhite = new PBRMaterial("curbW", this.scene);
    matWhite.albedoColor = new Color3(0.95, 0.95, 0.95);
    matWhite.metallic = 0.0; matWhite.roughness = 0.50;
    
    const n = this.samples.length;
    const redM: Mesh[] = [], whiteM: Mesh[] = [];
    
    // Curbs en ambos lados de la pista
    for (const sign of [-1, 1] as const) {
      // Distancia desde el centro: justo en el borde de la pista
      const dist = this.halfWidth - 0.25; // Más cerca del borde
      
      for (let i = 0; i < n; i += 3) { // Cada 3 samples para mejor alineación
        const { center, tangent, side } = this.getFrameAt(i);
        
        // Crear curb más delgado y bajo
        const c = MeshBuilder.CreateBox(`_c_${sign}_${i}`,
          { width: 0.45, height: 0.08, depth: 1.5 }, this.scene);
        
        // Posicionar en el borde exacto de la pista
        c.position = center.add(side.scale(sign * dist)).add(new Vector3(0, 0.04, 0));
        c.rotation.y = Math.atan2(tangent.x, tangent.z);
        
        // Alternar rojo/blanco cada 6 samples (patrón más espaciado)
        (i % 6 === 0 ? redM : whiteM).push(c);
      }
    }
    
    // Merge para optimización
    if (redM.length) { 
      const m = Mesh.MergeMeshes(redM, true, true); 
      if (m) { 
        m.material = matRed; 
        m.receiveShadows = true; 
      } 
    }
    
    if (whiteM.length) { 
      const m = Mesh.MergeMeshes(whiteM, true, true); 
      if (m) { 
        m.material = matWhite; 
        m.receiveShadows = true; 
      } 
    }
  }



  private buildMarkings(): void {
    const f = this.getFrameAt(0);
    const yaw0 = Math.atan2(f.tangent.x, f.tangent.z);
    const origin = this.samples[0]!;
    
    // ══════════════════════════════════════════════════════════
    // LÍNEA DE META - Cuadros de ajedrez alineados con la pista
    // ══════════════════════════════════════════════════════════
    // Ancho total = halfWidth * 2 = 26 unidades
    // Usamos 13 columnas × 2 unidades = 26 (exactamente el ancho de la pista)
    const TRACK_W = this.halfWidth * 2;   // 26
    const COLS    = 13;
    const ROWS    = 3;
    const SQ      = TRACK_W / COLS;       // ~2.0 — cuadros que llenan exactamente el ancho
    
    const matW = new StandardMaterial("sqW", this.scene);
    matW.diffuseColor  = new Color3(1.0, 1.0, 1.0);
    matW.emissiveColor = new Color3(0.20, 0.20, 0.20);
    
    const matB = new StandardMaterial("sqB", this.scene);
    matB.diffuseColor  = new Color3(0.05, 0.05, 0.05);
    matB.emissiveColor = new Color3(0.0, 0.0, 0.0);
    
    const cos = Math.cos(yaw0), sin = Math.sin(yaw0);
    const checkMeshes: Mesh[] = [];
    const checkMatsW: Mesh[] = [];
    const checkMatsB: Mesh[] = [];
    
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        // lx = posición lateral (a lo ancho de la pista)
        // lz = posición longitudinal (a lo largo de la pista)
        const lx = (col - (COLS - 1) / 2) * SQ;
        const lz = (row - (ROWS - 1) / 2) * SQ;
        const sq = MeshBuilder.CreateGround(`sq_${col}_${row}`,
          { width: SQ, height: SQ, subdivisions: 1 }, this.scene);
        // Y = origin.y + 0.02 para que quede justo sobre el asfalto sin sobresalir
        sq.position.set(
          origin.x + lx * cos - lz * sin,
          origin.y + 0.02,
          origin.z + lx * sin + lz * cos,
        );
        sq.rotation.y = yaw0;
        if ((col + row) % 2 === 0) checkMatsW.push(sq);
        else checkMatsB.push(sq);
        checkMeshes.push(sq);
      }
    }
    
    // Merge para rendimiento
    const mergedW = Mesh.MergeMeshes(checkMatsW, true, true);
    if (mergedW) mergedW.material = matW;
    const mergedB = Mesh.MergeMeshes(checkMatsB, true, true);
    if (mergedB) mergedB.material = matB;
    
    // Pórtico de meta
    this.buildFinishLineGantry(origin, yaw0);
  }
  
  /** Crea pórtico/arco estructural sobre la línea de meta */
  private buildFinishLineGantry(origin: Vector3, yaw: number): void {
    const matStruct = new PBRMaterial("gantryMat", this.scene);
    matStruct.albedoColor = new Color3(0.85, 0.10, 0.05);
    matStruct.metallic = 0.7;
    matStruct.roughness = 0.3;
    
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const side = new Vector3(-sin, 0, cos);
    
    const colHeight = 7;
    const colWidth = 0.4;
    const colDepth = 0.4;
    const colSpacing = this.halfWidth + 2;
    
    const leftCol = MeshBuilder.CreateBox("gantryColL", 
      { width: colWidth, height: colHeight, depth: colDepth }, this.scene);
    leftCol.position.copyFrom(origin.add(side.scale(-colSpacing)).add(new Vector3(0, colHeight / 2, 0)));
    leftCol.rotation.y = yaw;
    leftCol.material = matStruct;
    leftCol.receiveShadows = true;
    
    const rightCol = MeshBuilder.CreateBox("gantryColR", 
      { width: colWidth, height: colHeight, depth: colDepth }, this.scene);
    rightCol.position.copyFrom(origin.add(side.scale(colSpacing)).add(new Vector3(0, colHeight / 2, 0)));
    rightCol.rotation.y = yaw;
    rightCol.material = matStruct;
    rightCol.receiveShadows = true;
    
    const beamWidth = colSpacing * 2 + 1;
    const beamHeight = 0.5;
    const beamDepth = 0.5;
    
    const beam = MeshBuilder.CreateBox("gantryBeam", 
      { width: beamWidth, height: beamHeight, depth: beamDepth }, this.scene);
    beam.position.copyFrom(origin.add(new Vector3(0, colHeight - beamHeight / 2, 0)));
    beam.rotation.y = yaw;
    beam.material = matStruct;
    beam.receiveShadows = true;
    
    const matFlag = new StandardMaterial("flagMat", this.scene);
    matFlag.diffuseColor = new Color3(1, 1, 1);
    matFlag.emissiveColor = new Color3(0.15, 0.15, 0.15);
    
    for (let i = -3; i <= 3; i++) {
      const flag = MeshBuilder.CreateCylinder(`flag_${i}`, 
        { height: 1.2, diameterTop: 0, diameterBottom: 0.6, tessellation: 3 }, this.scene);
      const flagX = i * 4;
      flag.position.copyFrom(
        origin
          .add(side.scale(flagX))
          .add(new Vector3(0, colHeight - 1.5, 0))
      );
      flag.rotation.y = yaw;
      flag.rotation.z = Math.PI;
      flag.material = i % 2 === 0 ? matFlag : matStruct;
    }
  }

  getFrameAt(i: number): { center: Vector3; tangent: Vector3; side: Vector3 } {
    const n = this.samples.length;
    const p0 = this.samples[i]!;
    const p1 = this.samples[(i + 1) % n]!;
    const tangent = p1.subtract(p0);
    tangent.y = 0;
    tangent.normalize();
    const side = Vector3.Cross(Vector3.Up(), tangent).normalize();
    return { center: p0.clone(), tangent, side };
  }

  project(world: Vector3): TrackProjection {
    const flat = new Vector3(world.x, 0, world.z);
    const n = this.samples.length;
    let bestD = Infinity, bestProj = world.clone(), bestTangent = new Vector3(0, 0, 1);
    let bestS = 0, bestLateral = 0, bestSlope = 0;

    for (let i = 0; i < n; i++) {
      const a = this.samples[i]!;
      const b = this.samples[(i + 1) % n]!;
      const aF = new Vector3(a.x, 0, a.z);
      const bF = new Vector3(b.x, 0, b.z);
      const ab = bF.subtract(aF);
      const ap = flat.subtract(aF);
      const den = Math.max(1e-6, ab.lengthSquared());
      const t = Math.max(0, Math.min(1, Vector3.Dot(ap, ab) / den));
      const proj = aF.add(ab.scale(t));
      const d = Vector3.Distance(flat, proj);
      if (d < bestD) {
        bestD = d;
        // Interpolar Y real
        const realY = a.y + t * (b.y - a.y);
        bestProj = new Vector3(proj.x, realY, proj.z);
        const tangent = ab.clone(); tangent.y = 0; tangent.normalize();
        bestTangent = tangent;
        bestS = (this.distAtSample[i]! + t * this.segmentLengths[i]!) / Math.max(1e-6, this.totalLength);
        const side = Vector3.Cross(Vector3.Up(), tangent).normalize();
        const lv = flat.subtract(proj); lv.y = 0;
        bestLateral = Vector3.Dot(lv, side);
        // Pendiente: diferencia de Y entre los dos samples / distancia horizontal
        const horizDist = Math.max(1e-6, Vector3.Distance(aF, bF));
        bestSlope = (b.y - a.y) / horizDist;
      }
    }

    return { closest: bestProj, tangent: bestTangent, slope: bestSlope, s: bestS, lateralDist: bestLateral };
  }
}
