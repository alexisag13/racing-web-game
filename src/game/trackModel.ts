import { Scene, SceneLoader } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

/**
 * Carga el modelo 3D de la pista Ahvenisto y lo posiciona en el mundo.
 * El modelo se escala para que coincida con el circuito procedural (~300m de largo).
 */
export function loadTrackModel(scene: Scene): void {
  SceneLoader.ImportMesh(
    "",
    "/assets/track/",
    "scene.gltf",
    scene,
    (meshes) => {
      if (!meshes.length) return;

      const root = meshes[0]!;

      // Escalar: el modelo original está en metros reales (~1km de largo)
      // Lo escalamos para que quepa en nuestro mundo de ~300m
      root.scaling.setAll(0.28);

      // Centrar en el origen del mundo
      root.position.set(0, -0.05, 0);

      // Todos los meshes reciben sombras
      for (const mesh of meshes) {
        mesh.receiveShadows = true;
      }

      console.log(`Pista cargada: ${meshes.length} meshes`);
    },
    null,
    (_scene, message) => {
      console.error("Error cargando pista:", message);
    },
  );
}
