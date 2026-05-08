import {
  AbstractMesh,
  PBRMaterial,
  Scene,
  SceneLoader,
  TransformNode,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export type CarStyleId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface CarDef {
  id: CarStyleId;
  name: string;
  folder: string;
  /** Nombre del archivo del modelo. Por defecto "scene.gltf". */
  file?: string;
  scale: number;
  /** Rotación de corrección de orientación del modelo (aplicada en pivot, NO en rootMesh).
   *  El pivot es hijo del root pero NO hereda la rotación Y dinámica del root.
   *  Así rotX/rotZ no interfieren con el yaw del ArcadeCar. */
  rotX: number;
  rotZ: number;
  /** rotY del rootMesh para alinear el frente con -Z (que es lo que ArcadeCar espera).
   *  ArcadeCar hace root.rotation.y = yaw + PI, así que el frente del modelo
   *  debe apuntar en -Z para que con yaw=0 el auto avance en +Z. */
  rotY: number;
  /** Offset extra sumado al yaw en ArcadeCar.syncRotation.
   *  Usar PI (default) para modelos con frente en -Z.
   *  Usar 0 para modelos con frente en +Z. */
  yawOffset?: number;
  color: string;
  accent: string;
}

const PI = Math.PI;

export const CAR_DEFS: CarDef[] = [
  {
    // McLaren: eje largo X, frente en -X. rotY=0 (ArcadeCar suma PI → -X+PI = +Z ✓)
    id: 0, name: "McLaren P1 GTR",      folder: "car",
    scale: 0.007,  rotX: 0,       rotZ: 0, rotY: 0,
    color: "#e8100a", accent: "#ff5544",
  },
  {
    id: 1, name: "Lamborghini Huracán", folder: "car4",
    scale: 1.3,    rotX: -PI / 1000, rotZ: 0, rotY: 0, yawOffset: 0,
    color: "#f5cc05", accent: "#ffe566",
  },
  {
    // Porsche: eje largo Z, frente en -Z. rotY=0.
    id: 2, name: "Porsche 911 Turbo",   folder: "car3",
    scale: 1.1, rotX: 0,       rotZ: 0, rotY: 0,
    color: "#c8c8c8", accent: "#e8e8e8",
  },
  {
    // Dodge: eje largo Y (parado). Misma lógica que Huracán.
    id: 3, name: "Dodge Challenger SRT", folder: "car2",
    scale: 1.5, rotX: -PI / 1000, rotZ: 0, rotY: PI,
    color: "#1a1a2e", accent: "#5555cc",
  },
  {
    // Golf: eje largo Z, frente en -Z. rotY=0.
    id: 4, name: "Volkswagen Golf GTI", folder: "car7",
    scale: 129.780, rotX: 0,       rotZ: 0, rotY: 0,
    color: "#cc2222", accent: "#ff4444",
  },
  {
    // Jeep GC: eje largo Z, frente en -Z. rotY=0.
    id: 5, name: "Jeep Trackhawk",      folder: "car5",
    scale: 0.379,  rotX: 0,       rotZ: 0, rotY: 0,
    color: "#1a3a1a", accent: "#44cc44",
  },
  {
    // Toyota GR86 Pandem: GLB, frente típicamente en -Z. rotY=0.
    id: 6, name: "Toyota GR86 Pandem",  folder: "car8", file: "scene.glb",
    scale: 130.0,    rotX: 0,       rotZ: 0, rotY: 0,
    color: "#ffffff", accent: "#cccccc",
  },
];

/**
 * Jerarquía de nodos:
 *
 *   root  ← ArcadeCar mueve esto (position + rotation.y = yaw + PI)
 *     └─ pivot  ← absorbe rotX/rotZ de corrección. NO tiene rotY propio.
 *          └─ rootMesh  ← escala + rotY para alinear frente con -Z
 *
 * Por qué pivot separado:
 *   Si ponemos rotX directamente en rootMesh, cuando ArcadeCar rota el root en Y,
 *   el eje "adelante" del mesh ya no está en el plano XZ → el auto se inclina al girar.
 *   El pivot absorbe rotX/rotZ sin interferir con la rotación Y dinámica del root.
 */
export function createCarRoot(scene: Scene, styleId: CarStyleId): TransformNode {
  const def = CAR_DEFS[styleId] ?? CAR_DEFS[0]!;
  const root = new TransformNode(
    `car_${styleId}_${Math.random().toString(36).slice(2)}`,
    scene,
  );

  // Guardar yawOffset en metadata para que ArcadeCar lo use en syncRotation
  root.metadata = { yawOffset: def.yawOffset ?? Math.PI };

  SceneLoader.ImportMesh(
    "",
    `/assets/${def.folder}/`,
    def.file ?? "scene.gltf",
    scene,
    (meshes) => {
      if (!meshes.length) return;

      // Pivot: solo rotX y rotZ de corrección de orientación
      const pivot = new TransformNode(`pivot_${styleId}`, scene);
      pivot.parent = root;
      pivot.rotation.x = def.rotX;
      pivot.rotation.z = def.rotZ;
      // Sin rotY en el pivot — la rotación Y la maneja ArcadeCar en el root

      const rootMesh = meshes[0]!;
      rootMesh.parent = pivot;
      rootMesh.scaling.setAll(def.scale);
      // rotY en el mesh para alinear el frente con -Z
      rootMesh.rotation.set(0, def.rotY, 0);
      rootMesh.position.setAll(0);

      // Calcular offset de suelo automáticamente tras el primer render
      let minWorldY = Infinity;
      for (const mesh of meshes) {
        mesh.receiveShadows = true;
        if (!mesh.material) continue;
        if (!(mesh.material instanceof PBRMaterial)) continue;
        (mesh.material as PBRMaterial).environmentIntensity = 0.55;
      }

      scene.onAfterRenderObservable.addOnce(() => {
        for (const mesh of meshes) {
          if (!mesh.getBoundingInfo) continue;
          try {
            mesh.computeWorldMatrix(true);
            const minY = mesh.getBoundingInfo().boundingBox.minimumWorld.y;
            if (minY < minWorldY) minWorldY = minY;
          } catch { /* sin geometría */ }
        }
        // Subir el pivot para que el punto más bajo quede en Y=0 del root
        if (isFinite(minWorldY) && minWorldY < 0.4) {
          pivot.position.y -= minWorldY - 0.05;
        }
      });
    },
    null,
    (_scene, msg) => console.error(`Error cargando ${def.name}:`, msg),
  );

  return root;
}

/** Meshes hijos del root — para registrar en el ShadowGenerator. */
export function getCarMeshes(root: TransformNode): AbstractMesh[] {
  return root.getChildMeshes(false);
}
