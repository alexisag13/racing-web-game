import { Scene } from "@babylonjs/core";

/**
 * El modelo de pista externo (track/scene.gltf) tiene ~80 MB de texturas
 * y no se usa porque la pista es procedural. No se carga.
 */
export function loadTrackModel(_scene: Scene): void {
  // Deshabilitado — la pista procedural en track.ts ya cubre todo
}
