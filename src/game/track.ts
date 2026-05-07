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
    this.buildGrandstands(); // Gradas en ubicaciones estratégicas
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

  /** Genera textura de césped MEJORADA Y VISIBLE */
  private generateRealisticGrassTexture(): Texture {
    const TS = 512; // Resolución moderada para rendimiento
    const tex = new DynamicTexture("grassTex", { width: TS, height: TS }, this.scene, false);
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    const ctx = tex.getContext() as CanvasRenderingContext2D;

    // Base verde natural con variación
    const baseColors = [
      "#2d6b22", "#2a6520", "#2f7024", "#286018", "#316c26",
      "#2b6721", "#2e6923", "#296319", "#306b25", "#2c6822"
    ];

    // Llenar con parches
    for (let y = 0; y < TS; y += 20) {
      for (let x = 0; x < TS; x += 20) {
        ctx.fillStyle = baseColors[Math.floor(Math.random() * baseColors.length)]!;
        ctx.fillRect(x, y, 20, 20);
      }
    }

    // Rayas de corte de césped VISIBLES
    for (let y = 0; y < TS; y += 12) {
      const shade = y % 24 === 0 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.12)";
      ctx.fillStyle = shade;
      ctx.fillRect(0, y, TS, 12);
    }

    // Textura granular (briznas)
    const imgData = ctx.getImageData(0, 0, TS, TS);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() * 25 - 12) | 0;
      d[i]!     = Math.max(0, Math.min(255, d[i]!     + noise));
      d[i + 1]! = Math.max(0, Math.min(255, d[i + 1]! + noise + 10));
      d[i + 2]! = Math.max(0, Math.min(255, d[i + 2]! + (noise >> 1)));
    }

    // Manchas oscuras (sombras)
    for (let k = 0; k < 40; k++) {
      const px = Math.random() * TS;
      const py = Math.random() * TS;
      const r = 20 + Math.random() * 40;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, "rgba(0,0,0,0.20)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }

    // Manchas claras (luz)
    for (let k = 0; k < 25; k++) {
      const px = Math.random() * TS;
      const py = Math.random() * TS;
      const r = 15 + Math.random() * 30;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, "rgba(180,220,140,0.15)");
      grad.addColorStop(1, "rgba(180,220,140,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }

    ctx.putImageData(imgData, 0, 0);
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

  /**
   * Gradas (grandstands) MEJORADAS con más detalle
   * Ajustadas a la pista nueva en ubicaciones estratégicas
   */
  private buildGrandstands(): void {
    /**
     * Ubicaciones estratégicas para gradas en la pista extendida:
     * ZONA DE META: Múltiples gradas grandes (la zona más importante)
     * Otras zonas: Gradas complementarias
     */
    
    const grandstands = [
      // ══════════════════════════════════════════════════════════
      // ZONA DE META - MÚLTIPLES GRADAS GRANDES (la más importante)
      // ══════════════════════════════════════════════════════════
      
      // Grada principal IZQUIERDA (la más grande)
      { 
        x: -45, z: -100, 
        yaw: Math.PI * 0.5, // Mirando hacia la pista
        width: 120, tiers: 15, tierHeight: 0.8, tierDepth: 1.2
      },
      
      // Grada DERECHA de la meta
      { 
        x: 45, z: -100, 
        yaw: Math.PI * 1.5, // Mirando hacia la pista desde el otro lado
        width: 100, tiers: 12, tierHeight: 0.8, tierDepth: 1.2
      },
      
      // Grada TRASERA de la zona de meta (detrás de la línea)
      { 
        x: 0, z: 30, 
        yaw: Math.PI, // Mirando hacia la línea de meta
        width: 90, tiers: 10, tierHeight: 0.8, tierDepth: 1.2
      },
      
      // Grada LATERAL NORTE de la recta principal
      { 
        x: -50, z: -200, 
        yaw: Math.PI * 0.5,
        width: 80, tiers: 10, tierHeight: 0.8, tierDepth: 1.2
      },
      
      // Grada LATERAL SUR de la recta principal
      { 
        x: 50, z: -200, 
        yaw: Math.PI * 1.5,
        width: 80, tiers: 10, tierHeight: 0.8, tierDepth: 1.2
      },
      
      // ══════════════════════════════════════════════════════════
      // OTRAS ZONAS DEL CIRCUITO
      // ══════════════════════════════════════════════════════════
      
      // Grada ESTE - Curva rápida (exterior)
      { 
        x: 420, z: -320, 
        yaw: Math.PI * 1.15,
        width: 60, tiers: 8, tierHeight: 0.8, tierDepth: 1.2
      },
      
      // Grada RECTA TRASERA NORTE
      { 
        x: 150, z: 210, 
        yaw: Math.PI * 1.5,
        width: 70, tiers: 10, tierHeight: 0.8, tierDepth: 1.2
      },
      
      // Grada RECTA TRASERA SUR
      { 
        x: -150, z: 210, 
        yaw: Math.PI * 1.5,
        width: 70, tiers: 10, tierHeight: 0.8, tierDepth: 1.2
      },
      
      // Grada OESTE - Sector técnico
      { 
        x: -430, z: -180, 
        yaw: Math.PI * 0.25,
        width: 55, tiers: 8, tierHeight: 0.8, tierDepth: 1.2
      },
    ];

    for (const gs of grandstands) {
      this.buildDetailedGrandstand(
        new Vector3(gs.x, 0, gs.z),
        gs.yaw,
        gs.width,
        gs.tiers,
        gs.tierHeight,
        gs.tierDepth
      );
    }
  }

  /**
   * Construye una grada detallada con estructura realista
   */
  private buildDetailedGrandstand(
    position: Vector3,
    yaw: number,
    width: number,
    tiers: number,
    tierHeight: number,
    tierDepth: number
  ): void {
    const totalHeight = tiers * tierHeight;
    const totalDepth = tiers * tierDepth;

    // ══════════════════════════════════════════════════════════
    // MATERIALES
    // ══════════════════════════════════════════════════════════
    
    // Estructura metálica
    const matSteel = new PBRMaterial(`steel_${position.x}`, this.scene);
    matSteel.albedoColor = new Color3(0.70, 0.72, 0.75);
    matSteel.metallic = 0.85;
    matSteel.roughness = 0.35;

    // Asientos ROJOS (más llamativos)
    const matSeats = new PBRMaterial(`seats_${position.x}`, this.scene);
    matSeats.albedoColor = new Color3(0.85, 0.10, 0.05); // ROJO BRILLANTE
    matSeats.metallic = 0.0;
    matSeats.roughness = 0.60;
    matSeats.emissiveColor = new Color3(0.08, 0.01, 0.0); // Ligero brillo rojo

    // Concreto
    const matConcrete = new PBRMaterial(`concrete_${position.x}`, this.scene);
    matConcrete.albedoColor = new Color3(0.55, 0.55, 0.58);
    matConcrete.metallic = 0.0;
    matConcrete.roughness = 0.90;

    // Barandilla
    const matRail = new PBRMaterial(`rail_${position.x}`, this.scene);
    matRail.albedoColor = new Color3(0.85, 0.85, 0.88);
    matRail.metallic = 0.75;
    matRail.roughness = 0.25;

    // ══════════════════════════════════════════════════════════
    // ESTRUCTURA DE SOPORTE (columnas y vigas)
    // ══════════════════════════════════════════════════════════
    const numColumns = Math.floor(width / 6) + 1;
    const columnMeshes: Mesh[] = [];
    
    for (let i = 0; i < numColumns; i++) {
      const colX = (i / (numColumns - 1) - 0.5) * width;
      
      // Columna principal
      const col = MeshBuilder.CreateBox(`col_${position.x}_${i}`, 
        { width: 0.5, height: totalHeight, depth: 0.5 }, this.scene);
      
      const localPos = new Vector3(colX, totalHeight / 2, -totalDepth * 0.5);
      const rotated = this.rotatePoint(localPos, yaw);
      col.position.copyFrom(position.add(rotated));
      col.rotation.y = yaw;
      columnMeshes.push(col);
      
      // Vigas diagonales de soporte (cada 3 columnas)
      if (i % 3 === 0 && i < numColumns - 1) {
        const brace = MeshBuilder.CreateBox(`brace_${position.x}_${i}`, 
          { width: 0.3, height: totalHeight * 0.7, depth: 0.3 }, this.scene);
        
        const bracePos = new Vector3(colX + 3, totalHeight * 0.35, -totalDepth * 0.25);
        const braceRotated = this.rotatePoint(bracePos, yaw);
        brace.position.copyFrom(position.add(braceRotated));
        brace.rotation.y = yaw;
        brace.rotation.z = Math.PI * 0.15; // Inclinación diagonal
        columnMeshes.push(brace);
      }
    }
    
    // Merge columnas
    const columnsMerged = Mesh.MergeMeshes(columnMeshes, true, true);
    if (columnsMerged) {
      columnsMerged.material = matSteel;
      columnsMerged.receiveShadows = true;
    }

    // ══════════════════════════════════════════════════════════
    // ESCALONES (tiers) - Base de concreto + asientos
    // ══════════════════════════════════════════════════════════
    const concreteMeshes: Mesh[] = [];
    const seatMeshes: Mesh[] = [];
    
    for (let tier = 0; tier < tiers; tier++) {
      const tierY = tier * tierHeight;
      const tierZ = -tier * tierDepth;
      
      // Base de concreto del escalón
      const concrete = MeshBuilder.CreateBox(`concrete_${position.x}_${tier}`, 
        { width: width, height: tierHeight * 0.6, depth: tierDepth }, this.scene);
      
      const concretePos = new Vector3(0, tierY + tierHeight * 0.3, tierZ);
      const concreteRotated = this.rotatePoint(concretePos, yaw);
      concrete.position.copyFrom(position.add(concreteRotated));
      concrete.rotation.y = yaw;
      concreteMeshes.push(concrete);
      
      // Asientos individuales (simulados con boxes pequeños)
      const numSeats = Math.floor(width / 0.6);
      for (let s = 0; s < numSeats; s++) {
        const seatX = (s / (numSeats - 1) - 0.5) * (width - 1);
        
        const seat = MeshBuilder.CreateBox(`seat_${position.x}_${tier}_${s}`, 
          { width: 0.5, height: 0.4, depth: 0.5 }, this.scene);
        
        const seatPos = new Vector3(seatX, tierY + tierHeight * 0.8, tierZ + tierDepth * 0.25);
        const seatRotated = this.rotatePoint(seatPos, yaw);
        seat.position.copyFrom(position.add(seatRotated));
        seat.rotation.y = yaw;
        seatMeshes.push(seat);
      }
    }
    
    // Merge escalones
    const concreteMerged = Mesh.MergeMeshes(concreteMeshes, true, true);
    if (concreteMerged) {
      concreteMerged.material = matConcrete;
      concreteMerged.receiveShadows = true;
    }
    
    const seatsMerged = Mesh.MergeMeshes(seatMeshes, true, true);
    if (seatsMerged) {
      seatsMerged.material = matSeats;
      seatsMerged.receiveShadows = true;
    }

    // ══════════════════════════════════════════════════════════
    // BARANDILLAS (en la parte superior y cada 4 filas)
    // ══════════════════════════════════════════════════════════
    const railMeshes: Mesh[] = [];
    
    for (let tier = 0; tier <= tiers; tier += 4) {
      if (tier > tiers) tier = tiers; // Última fila
      
      const railY = tier * tierHeight;
      const railZ = -tier * tierDepth;
      
      // Barandilla horizontal
      const rail = MeshBuilder.CreateBox(`rail_${position.x}_${tier}`, 
        { width: width, height: 0.15, depth: 0.08 }, this.scene);
      
      const railPos = new Vector3(0, railY + 1.0, railZ);
      const railRotated = this.rotatePoint(railPos, yaw);
      rail.position.copyFrom(position.add(railRotated));
      rail.rotation.y = yaw;
      railMeshes.push(rail);
      
      // Postes verticales cada 4 metros
      const numPosts = Math.floor(width / 4) + 1;
      for (let p = 0; p < numPosts; p++) {
        const postX = (p / (numPosts - 1) - 0.5) * width;
        
        const post = MeshBuilder.CreateBox(`post_${position.x}_${tier}_${p}`, 
          { width: 0.08, height: 1.0, depth: 0.08 }, this.scene);
        
        const postPos = new Vector3(postX, railY + 0.5, railZ);
        const postRotated = this.rotatePoint(postPos, yaw);
        post.position.copyFrom(position.add(postRotated));
        post.rotation.y = yaw;
        railMeshes.push(post);
      }
    }
    
    const railsMerged = Mesh.MergeMeshes(railMeshes, true, true);
    if (railsMerged) {
      railsMerged.material = matRail;
      railsMerged.receiveShadows = true;
    }

    // ══════════════════════════════════════════════════════════
    // TECHO (cubierta metálica)
    // ══════════════════════════════════════════════════════════
    const roofHeight = totalHeight + 3;
    const roofDepth = totalDepth + 4;
    
    // Estructura del techo
    const roof = MeshBuilder.CreateBox(`roof_${position.x}`, 
      { width: width + 2, height: 0.25, depth: roofDepth }, this.scene);
    
    const roofPos = new Vector3(0, roofHeight, -totalDepth * 0.5);
    const roofRotated = this.rotatePoint(roofPos, yaw);
    roof.position.copyFrom(position.add(roofRotated));
    roof.rotation.y = yaw;
    roof.rotation.x = -Math.PI * 0.05; // Ligera inclinación
    roof.material = matSteel;
    roof.receiveShadows = true;
    
    // Soportes del techo (vigas verticales)
    const roofSupportMeshes: Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const supportX = (i / 3 - 0.5) * width;
      
      const support = MeshBuilder.CreateBox(`roofsup_${position.x}_${i}`, 
        { width: 0.4, height: 3, depth: 0.4 }, this.scene);
      
      const supPos = new Vector3(supportX, totalHeight + 1.5, -totalDepth - 1);
      const supRotated = this.rotatePoint(supPos, yaw);
      support.position.copyFrom(position.add(supRotated));
      support.rotation.y = yaw;
      roofSupportMeshes.push(support);
    }
    
    const roofSupMerged = Mesh.MergeMeshes(roofSupportMeshes, true, true);
    if (roofSupMerged) {
      roofSupMerged.material = matSteel;
      roofSupMerged.receiveShadows = true;
    }

    // ══════════════════════════════════════════════════════════
    // DETALLES: Paneles publicitarios en la parte frontal
    // ══════════════════════════════════════════════════════════
    const adBoard = MeshBuilder.CreateBox(`adboard_${position.x}`, 
      { width: width * 0.8, height: 2, depth: 0.1 }, this.scene);
    
    const adPos = new Vector3(0, 1, 0.5);
    const adRotated = this.rotatePoint(adPos, yaw);
    adBoard.position.copyFrom(position.add(adRotated));
    adBoard.rotation.y = yaw;
    
    const matAd = new StandardMaterial(`ad_${position.x}`, this.scene);
    matAd.diffuseColor = new Color3(0.95, 0.95, 0.95);
    matAd.emissiveColor = new Color3(0.1, 0.1, 0.1);
    adBoard.material = matAd;
  }

  /** Rota un punto alrededor del eje Y */
  private rotatePoint(point: Vector3, yaw: number): Vector3 {
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    return new Vector3(
      point.x * cos - point.z * sin,
      point.y,
      point.x * sin + point.z * cos
    );
  }

  private buildMarkings(): void {
    const f = this.getFrameAt(0);
    const yaw0 = Math.atan2(f.tangent.x, f.tangent.z);
    const origin = this.samples[0]!;
    
    // ══════════════════════════════════════════════════════════
    // LÍNEA DE META - Cuadros de ajedrez grandes
    // ══════════════════════════════════════════════════════════
    const COLS = 14, ROWS = 4, SQ = 3.2;
    
    const matW = new StandardMaterial("sqW", this.scene);
    matW.diffuseColor = new Color3(1.0, 1.0, 1.0);
    matW.emissiveColor = new Color3(0.25, 0.25, 0.25);
    
    const matB = new StandardMaterial("sqB", this.scene);
    matB.diffuseColor = new Color3(0.02, 0.02, 0.02);
    matB.emissiveColor = new Color3(0.0, 0.0, 0.0);
    
    const cos = Math.cos(yaw0), sin = Math.sin(yaw0);
    
    // Cuadros de ajedrez
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const lx = (col - (COLS - 1) / 2) * SQ;
        const lz = (row - (ROWS - 1) / 2) * SQ;
        const sq = MeshBuilder.CreateGround(`sq_${col}_${row}`,
          { width: SQ, height: SQ, subdivisions: 1 }, this.scene);
        sq.position.set(origin.x + lx * cos - lz * sin, origin.y + 0.06, origin.z + lx * sin + lz * cos);
        sq.rotation.y = yaw0;
        sq.material = (col + row) % 2 === 0 ? matW : matB;
      }
    }
    
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
