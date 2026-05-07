import "./style.css";
import "./lobby/lobby.css";
import { Lobby } from "./lobby/Lobby";
import { Game } from "./game/Game";

async function main(): Promise<void> {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("No se encontró #renderCanvas");

  // 1. Mostrar lobby — esperar selección de auto y configuración de sala
  const lobby = new Lobby();
  const result = await lobby.show();

  // 2. Iniciar el juego con los parámetros elegidos
  void new Game(canvas, result.carStyle, result.playerName, result.network);
}

void main();
