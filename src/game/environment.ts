import {
  Color3,
  Color4,
  CubeTexture,
  DirectionalLight,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  SceneLoader,
  ShadowGenerator,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export function setupEnvironment(
  scene: Scene,
  hemi: HemisphericLight,
): { sun: DirectionalLight; shadows: ShadowGenerator } {

  const envTex = CubeTexture.CreateFromPrefilteredData("/assets/env/sky.env", scene);
  scene.environmentTexture   = envTex;
  scene.environmentIntensity = 1.2; // Reducido para rendimiento

  const skybox = scene.createDefaultSkybox(envTex, true, 1500, 0.15);
  if (skybox) {
    skybox.isPickable = false;
    skybox.infiniteDistance = true;
  }

  // Luz hemisférica BALANCEADA
  hemi.direction = new Vector3(0.2, 1, 0.1);
  hemi.intensity = 1.1;
  hemi.groundColor.set(0.38, 0.35, 0.30);
  hemi.diffuse.set(0.98, 0.98, 0.96);

  // Niebla atmosférica SUTIL
  scene.fogMode    = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.00006;
  scene.fogColor   = new Color3(0.80, 0.82, 0.86);
  scene.clearColor = new Color4(0.72, 0.76, 0.82, 1);

  // Sol direccional BALANCEADO
  const sun = new DirectionalLight("sun", new Vector3(-0.4, -0.9, -0.25), scene);
  sun.intensity = 1.8;
  sun.diffuse   = new Color3(1.0, 0.98, 0.92);
  sun.specular  = new Color3(0.75, 0.70, 0.60);
  sun.position  = new Vector3(110, 155, 85);

  // Sombras OPTIMIZADAS (1024 en lugar de 2048)
  const shadows = new ShadowGenerator(1024, sun); // REDUCIDO para rendimiento
  shadows.usePercentageCloserFiltering = true;
  shadows.filteringQuality = ShadowGenerator.QUALITY_LOW; // REDUCIDO
  shadows.bias       = 0.001;
  shadows.normalBias = 0.02;
  shadows.darkness   = 0.30;

  // Luz de relleno BALANCEADA
  const fill = new DirectionalLight("fill", new Vector3(0.6, 0.7, 0.35), scene);
  fill.intensity = 0.45;
  fill.diffuse   = new Color3(0.75, 0.82, 0.98);
  fill.specular  = new Color3(0, 0, 0);

  // Luz de contraluz SUTIL
  const rim = new DirectionalLight("rim", new Vector3(0.4, 0.25, -0.85), scene);
  rim.intensity = 0.25;
  rim.diffuse   = new Color3(0.92, 0.90, 0.88);
  rim.specular  = new Color3(0.25, 0.25, 0.25);

  createMountains(scene);
  loadTrees(scene);
  createClouds(scene);

  return { sun, shadows };
}

/**
 * Nubes volumétricas OPTIMIZADAS (3 nubes grandes)
 */
function createClouds(scene: Scene): void {
  const cloudMat = new PBRMaterial("cloudMat", scene);
  cloudMat.albedoColor = new Color3(0.98, 0.98, 1.0);
  cloudMat.emissiveColor = new Color3(0.5, 0.5, 0.52);
  cloudMat.alpha = 0.7;
  cloudMat.backFaceCulling = false;
  cloudMat.metallic = 0.0;
  cloudMat.roughness = 1.0;

  // Solo 3 nubes grandes estratégicamente colocadas
  const clouds = [
    { x:    0, y: 220, z: -650, sx: 280, sy: 60, sz: 170 }, // Norte
    { x:  600, y: 210, z:  200, sx: 260, sy: 55, sz: 160 }, // Este
    { x: -550, y: 215, z:  400, sx: 270, sy: 58, sz: 165 }, // Oeste
  ];

  for (const { x, y, z, sx, sy, sz } of clouds) {
    const cloud = MeshBuilder.CreateSphere(`cloud_${x}_${z}`,
      { diameterX: sx, diameterY: sy, diameterZ: sz, segments: 8 }, scene); // Menos segmentos
    cloud.position.set(x, y, z);
    cloud.material = cloudMat;
    cloud.isPickable = false;
  }
}

/**
 * Montañas OPTIMIZADAS con COLOR - ALEJADAS de la pista
 */
function createMountains(scene: Scene): void {
  // Materiales
  const matNear = new PBRMaterial("mtnNear", scene);
  matNear.albedoColor = new Color3(0.35, 0.28, 0.22);
  matNear.metallic = 0.0;
  matNear.roughness = 0.95;
  matNear.directIntensity = 0.8;
  matNear.environmentIntensity = 0.3;

  const matMid = new PBRMaterial("mtnMid", scene);
  matMid.albedoColor = new Color3(0.38, 0.35, 0.28);
  matMid.metallic = 0.0;
  matMid.roughness = 0.92;
  matMid.directIntensity = 0.8;
  matMid.environmentIntensity = 0.3;

  const matFar = new PBRMaterial("mtnFar", scene);
  matFar.albedoColor = new Color3(0.50, 0.52, 0.55);
  matFar.metallic = 0.0;
  matFar.roughness = 0.88;
  matFar.directIntensity = 0.7;
  matFar.environmentIntensity = 0.4;
  matFar.alpha = 0.88;

  const matSnow = new PBRMaterial("mtnSnow", scene);
  matSnow.albedoColor = new Color3(0.88, 0.88, 0.90);
  matSnow.metallic = 0.0;
  matSnow.roughness = 0.80;
  matSnow.directIntensity = 0.9;
  matSnow.environmentIntensity = 0.5;

  // MONTAÑAS ALEJADAS - Fuera del área de la pista (pista va de ~-500 a +500)
  // Capa cercana — 4 montañas MÁS ALEJADAS
  const near = [
    { x: -720, z: -720, h: 80,  r: 100 },
    { x:  720, z: -720, h: 85,  r: 105 },
    { x:  720, z:  720, h: 82,  r: 103 },
    { x: -720, z:  720, h: 88,  r: 108 },
  ];
  
  const nearMeshes: Mesh[] = [];
  const nearSnowMeshes: Mesh[] = [];
  
  for (const { x, z, h, r } of near) {
    const m = MeshBuilder.CreateCylinder(`mtnN_${x}_${z}`,
      { height: h, diameterTop: r * 0.25, diameterBottom: r * 2.2, tessellation: 10 }, scene);
    m.position.set(x, h * 0.5 - 2, z);
    nearMeshes.push(m);
    
    const snowH = h * 0.3;
    const snow = MeshBuilder.CreateCylinder(`mtnN_snow_${x}_${z}`,
      { height: snowH, diameterTop: r * 0.15, diameterBottom: r * 0.35, tessellation: 10 }, scene);
    snow.position.set(x, h - snowH * 0.5 - 2, z);
    nearSnowMeshes.push(snow);
  }
  
  const nearMerged = Mesh.MergeMeshes(nearMeshes, true, true, undefined, false, true);
  if (nearMerged) {
    nearMerged.material = matNear;
    nearMerged.receiveShadows = true;
  }
  
  const nearSnowMerged = Mesh.MergeMeshes(nearSnowMeshes, true, true, undefined, false, true);
  if (nearSnowMerged) nearSnowMerged.material = matSnow;

  // Capa media — 4 montañas MÁS ALEJADAS
  const mid = [
    { x: -880, z: -880, h: 100, r: 130 },
    { x:  900, z: -820, h: 110, r: 145 },
    { x:  850, z:  900, h: 112, r: 148 },
    { x: -920, z:  860, h: 108, r: 140 },
  ];
  
  const midMeshes: Mesh[] = [];
  const midSnowMeshes: Mesh[] = [];
  
  for (const { x, z, h, r } of mid) {
    const m = MeshBuilder.CreateCylinder(`mtnM_${x}_${z}`,
      { height: h, diameterTop: r * 0.18, diameterBottom: r * 2.2, tessellation: 8 }, scene);
    m.position.set(x, h * 0.5 - 3, z);
    midMeshes.push(m);
    
    const snowH = h * 0.25;
    const snow = MeshBuilder.CreateCylinder(`mtnM_snow_${x}_${z}`,
      { height: snowH, diameterTop: r * 0.12, diameterBottom: r * 0.28, tessellation: 8 }, scene);
    snow.position.set(x, h - snowH * 0.5 - 3, z);
    midSnowMeshes.push(snow);
  }
  
  const midMerged = Mesh.MergeMeshes(midMeshes, true, true, undefined, false, true);
  if (midMerged) {
    midMerged.material = matMid;
    midMerged.receiveShadows = true;
  }
  
  const midSnowMerged = Mesh.MergeMeshes(midSnowMeshes, true, true, undefined, false, true);
  if (midSnowMerged) midSnowMerged.material = matSnow;

  // Capa lejana — 4 montañas EN EL HORIZONTE
  const far = [
    { x: -1100, z: -1100, h: 200, r: 250 },
    { x:  1100, z: -1050, h: 210, r: 265 },
    { x:  1050, z:  1100, h: 205, r: 260 },
    { x: -1120, z:  1080, h: 212, r: 268 },
  ];
  
  const farMeshes: Mesh[] = [];
  const farSnowMeshes: Mesh[] = [];
  
  for (const { x, z, h, r } of far) {
    const m = MeshBuilder.CreateCylinder(`mtnF_${x}_${z}`,
      { height: h, diameterTop: r * 0.12, diameterBottom: r * 2.2, tessellation: 6 }, scene);
    m.position.set(x, h * 0.5 - 5, z);
    farMeshes.push(m);
    
    const snowH = h * 0.35;
    const snow = MeshBuilder.CreateCylinder(`mtnF_snow_${x}_${z}`,
      { height: snowH, diameterTop: r * 0.08, diameterBottom: r * 0.20, tessellation: 6 }, scene);
    snow.position.set(x, h - snowH * 0.5 - 5, z);
    farSnowMeshes.push(snow);
  }
  
  const farMerged = Mesh.MergeMeshes(farMeshes, true, true, undefined, false, true);
  if (farMerged) farMerged.material = matFar;
  
  const farSnowMerged = Mesh.MergeMeshes(farSnowMeshes, true, true, undefined, false, true);
  if (farSnowMerged) farSnowMerged.material = matSnow;
}

function loadTrees(scene: Scene): void {
  // OPTIMIZADO: ~80 árboles estratégicamente colocados (antes 200+)
  const positions = [
    // ══════════════════════════════════════════════════════════
    // ZONA NORTE (recta principal) - Bosque visible
    // ══════════════════════════════════════════════════════════
    { x:  40, z: -270, s: 1.4 }, { x:  90, z: -260, s: 1.3 }, { x: 140, z: -250, s: 1.5 },
    { x: 190, z: -240, s: 1.2 }, { x: 240, z: -230, s: 1.4 }, { x: 290, z: -220, s: 1.3 },
    { x:  60, z: -300, s: 1.5 }, { x: 160, z: -290, s: 1.3 }, { x: 260, z: -280, s: 1.4 },
    
    // ══════════════════════════════════════════════════════════
    // ZONA ESTE - Lateral
    // ══════════════════════════════════════════════════════════
    { x: 450, z: -180, s: 1.3 }, { x: 455, z: -100, s: 1.5 }, { x: 450, z:  -20, s: 1.2 },
    { x: 445, z:   60, s: 1.4 }, { x: 440, z:  140, s: 1.3 }, { x: 435, z:  220, s: 1.5 },
    { x: 475, z: -140, s: 1.4 }, { x: 470, z:  -60, s: 1.2 }, { x: 465, z:   20, s: 1.3 },
    { x: 460, z:  100, s: 1.5 }, { x: 455, z:  180, s: 1.2 },
    
    // ══════════════════════════════════════════════════════════
    // ZONA SUR - Bosque denso
    // ══════════════════════════════════════════════════════════
    { x: 280, z:  330, s: 1.4 }, { x: 220, z:  340, s: 1.3 }, { x: 160, z:  350, s: 1.5 },
    { x: 100, z:  360, s: 1.2 }, { x:  40, z:  370, s: 1.4 }, { x: -20, z:  380, s: 1.3 },
    { x: -80, z:  370, s: 1.5 }, { x:-140, z:  360, s: 1.2 }, { x:-200, z:  350, s: 1.4 },
    { x:-260, z:  340, s: 1.3 }, { x:-300, z:  330, s: 1.5 },
    { x: 240, z:  370, s: 1.3 }, { x: 120, z:  390, s: 1.4 }, { x:   0, z:  400, s: 1.2 },
    { x:-120, z:  390, s: 1.5 }, { x:-240, z:  370, s: 1.3 },
    
    // ══════════════════════════════════════════════════════════
    // ZONA OESTE - Lateral
    // ══════════════════════════════════════════════════════════
    { x:-455, z:  260, s: 1.5 }, { x:-450, z:  180, s: 1.2 }, { x:-455, z:  100, s: 1.4 },
    { x:-450, z:   20, s: 1.3 }, { x:-455, z:  -60, s: 1.5 }, { x:-450, z: -140, s: 1.2 },
    { x:-455, z: -220, s: 1.4 },
    { x:-475, z:  220, s: 1.4 }, { x:-470, z:  140, s: 1.2 }, { x:-475, z:   60, s: 1.3 },
    { x:-470, z:  -20, s: 1.5 }, { x:-475, z: -100, s: 1.2 }, { x:-470, z: -180, s: 1.4 },
    
    // ══════════════════════════════════════════════════════════
    // INTERIOR DEL CIRCUITO - Grupos estratégicos
    // ══════════════════════════════════════════════════════════
    // Grupo noreste
    { x: 190, z:  -75, s: 1.0 }, { x: 210, z:  -80, s: 1.1 }, { x: 230, z:   20, s: 1.0 },
    { x: 250, z:   25, s: 0.9 }, { x: 270, z:   85, s: 1.1 }, { x: 250, z:  145, s: 1.0 },
    
    // Grupo sur interior
    { x: 110, z:  185, s: 1.2 }, { x:  60, z:  220, s: 1.0 }, { x: -70, z:  185, s: 1.1 },
    { x:-110, z:  145, s: 0.9 },
    
    // Grupo oeste interior
    { x:-190, z:   85, s: 1.1 }, { x:-210, z:   20, s: 1.0 }, { x:-180, z:  -55, s: 1.2 },
    { x:-150, z:  -95, s: 0.9 },
    
    // Grupo norte interior
    { x: -70, z: -115, s: 1.0 }, { x:  60, z: -115, s: 1.1 },
    
    // ══════════════════════════════════════════════════════════
    // RELLENO para densidad visual
    // ══════════════════════════════════════════════════════════
    { x: 120, z: -270, s: 1.2 }, { x: 350, z: -200, s: 1.3 }, { x: 370, z:   50, s: 1.1 },
    { x: 320, z:  250, s: 1.4 }, { x: 150, z:  340, s: 1.2 }, { x: -110, z:  350, s: 1.3 },
    { x:-280, z:  310, s: 1.2 }, { x:-380, z:  200, s: 1.4 }, { x:-390, z:    0, s: 1.1 },
    { x:-380, z: -200, s: 1.3 }, { x:-150, z: -260, s: 1.2 },
  ];

  SceneLoader.ImportMesh("", "/assets/tree/", "scene.gltf", scene, (meshes) => {
    if (!meshes.length) return;
    const root = meshes[0]!;
    root.scaling.setAll(0.008);
    root.isVisible = false;
    
    for (let i = 0; i < positions.length; i++) {
      const { x, z, s } = positions[i]!;
      const inst = root.clone(`tree_${i}`, null);
      if (!inst) continue;
      inst.isVisible = true;
      inst.position.set(x, 0, z);
      inst.scaling.setAll(0.008 * s);
      inst.rotation.y = Math.random() * Math.PI * 2;
      
      // Variación de color sutil
      inst.getChildMeshes().forEach((mesh) => {
        if (mesh.material && "albedoColor" in mesh.material) {
          const mat = mesh.material as PBRMaterial;
          const tint = 0.85 + Math.random() * 0.3;
          if (mat.albedoColor) {
            mat.albedoColor = mat.albedoColor.scale(tint);
          }
        }
      });
    }
  });
}
