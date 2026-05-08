/**
 * network.ts — Capa de red P2P con PeerJS (WebRTC)
 *
 * Roles:
 *  HOST  → crea la sala, genera el código, acepta conexiones entrantes
 *  GUEST → se une con el código del host
 *
 * Protocolo de mensajes (JSON):
 *  { type: "join",   playerId, carStyle, name }   → guest → host al conectar
 *  { type: "roster", players: PlayerInfo[] }       → host → todos al cambiar lista
 *  { type: "start" }                               → host → todos para iniciar carrera
 *  { type: "state", playerId, x, y, z, yaw, speed } → todos → todos cada frame
 *  { type: "ping" } / { type: "pong" }             → latencia
 */

import Peer, { type DataConnection } from "peerjs";

export type CarStyleId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface PlayerInfo {
  id: string;       // PeerJS peer ID
  name: string;
  carStyle: CarStyleId;
  isHost: boolean;
  ping: number;
}

export interface StateMsg {
  type: "state";
  playerId: string;
  x: number; y: number; z: number;
  yaw: number;
  speed: number;
}

type NetMsg =
  | { type: "join";   playerId: string; carStyle: CarStyleId; name: string }
  | { type: "roster"; players: PlayerInfo[] }
  | { type: "start" }
  | { type: "win";    playerId: string; name: string }
  | { type: "ping";   ts: number }
  | { type: "pong";   ts: number }
  | StateMsg;

export type NetworkRole = "host" | "guest";

export interface NetworkCallbacks {
  onRosterUpdate: (players: PlayerInfo[]) => void;
  onStart: () => void;
  onState: (msg: StateMsg) => void;
  onWin: (playerId: string, name: string) => void;
  onError: (msg: string) => void;
  onConnected: () => void;
}

const PEER_CONFIG = {
  // Servidor STUN público de Google — sin coste
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  },
};

export class NetworkManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private _role: NetworkRole = "guest";
  private _localPlayer: PlayerInfo | null = null;
  private _players: PlayerInfo[] = [];
  private _pingTimers: Map<string, number> = new Map();

  get role(): NetworkRole { return this._role; }
  get localPlayer(): PlayerInfo | null { return this._localPlayer; }
  get players(): PlayerInfo[] { return [...this._players]; }
  get roomCode(): string { return this.peer?.id ?? ""; }

  constructor(private readonly cb: NetworkCallbacks) {}

  /** Actualiza los callbacks después de la construcción */
  setCallbacks(cb: Partial<NetworkCallbacks>): void {
    if (cb.onRosterUpdate) this.cb.onRosterUpdate = cb.onRosterUpdate;
    if (cb.onStart)        this.cb.onStart        = cb.onStart;
    if (cb.onState)        this.cb.onState        = cb.onState;
    if (cb.onWin)          this.cb.onWin          = cb.onWin;
    if (cb.onError)        this.cb.onError        = cb.onError;
    if (cb.onConnected)    this.cb.onConnected    = cb.onConnected;
  }

  /** Anuncia victoria propia a todos los peers */
  sendWin(): void {
    if (!this._localPlayer) return;
    this.broadcast({ type: "win", playerId: this._localPlayer.id, name: this._localPlayer.name });
  }

  /** Crea una sala como host. Resuelve con el código de sala. */
  async createRoom(name: string, carStyle: CarStyleId): Promise<string> {
    this._role = "host";
    // Código corto de 4 letras mayúsculas — fácil de compartir
    const shortCode = Array.from({ length: 4 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
    ).join("");
    const peer = await this.initPeer(shortCode);

    this._localPlayer = {
      id: peer.id,
      name,
      carStyle,
      isHost: true,
      ping: 0,
    };
    this._players = [this._localPlayer];

    // Escuchar conexiones entrantes
    peer.on("connection", (conn) => {
      this.setupConnection(conn);
    });

    this.cb.onConnected();
    return peer.id;
  }

  /** Se une a una sala como guest. */
  async joinRoom(code: string, name: string, carStyle: CarStyleId): Promise<void> {
    this._role = "guest";
    const peer = await this.initPeer();

    this._localPlayer = {
      id: peer.id,
      name,
      carStyle,
      isHost: false,
      ping: 0,
    };

    const conn = peer.connect(code, { reliable: false, serialization: "json" });
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Tiempo de conexión agotado")), 10_000);
      conn.on("open", () => {
        window.clearTimeout(timeout);
        // IMPORTANTE: Agregar la conexión ANTES de setupConnection
        // porque setupConnection espera un evento "open" que ya ocurrió
        this.connections.set(conn.peer, conn);
        this.setupConnection(conn);
        // Presentarse al host
        this.send(conn, {
          type: "join",
          playerId: peer.id,
          carStyle,
          name,
        });
        // Iniciar ping periódico
        this.schedulePing(conn);
        resolve();
      });
      conn.on("error", (e) => {
        window.clearTimeout(timeout);
        reject(e);
      });
    });

    this.cb.onConnected();
  }

  /** Envía la señal de inicio a todos (solo host). */
  startRace(): void {
    if (this._role !== "host") return;
    this.broadcast({ type: "start" });
    this.cb.onStart();
  }

  /** Envía el estado del jugador local a todos los peers. */
  sendState(x: number, y: number, z: number, yaw: number, speed: number): void {
    if (!this._localPlayer) return;
    const msg = {
      type: "state" as const,
      playerId: this._localPlayer.id,
      x, y, z, yaw, speed,
    };
    this.broadcast(msg);
  }

  disconnect(): void {
    this.peer?.destroy();
    this.peer = null;
    this.connections.clear();
    this._players = [];
  }

  // ── Privados ──────────────────────────────────────────────────

  private initPeer(id?: string): Promise<Peer> {
    return new Promise((resolve, reject) => {
      const peer = id ? new Peer(id, PEER_CONFIG) : new Peer(PEER_CONFIG);
      this.peer = peer;

      const timeout = window.setTimeout(() => {
        reject(new Error("No se pudo conectar al servidor de señalización"));
      }, 12_000);

      peer.on("open", () => {
        window.clearTimeout(timeout);
        resolve(peer);
      });
      peer.on("error", (e) => {
        window.clearTimeout(timeout);
        this.cb.onError(String(e.message ?? e));
        reject(e);
      });
    });
  }

  private setupConnection(conn: DataConnection): void {
    conn.on("open", () => {
      this.connections.set(conn.peer, conn);
      // Iniciar ping periódico
      this.schedulePing(conn);
    });

    conn.on("data", (raw) => {
      const msg = raw as NetMsg;
      this.handleMessage(conn, msg);
    });

    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this._players = this._players.filter((p) => p.id !== conn.peer);
      this.cb.onRosterUpdate(this._players);
    });

    conn.on("error", (e) => {
      this.cb.onError(String(e.message ?? e));
    });
  }

  private handleMessage(conn: DataConnection, msg: NetMsg): void {
    switch (msg.type) {
      case "join": {
        // Solo el host recibe esto
        const newPlayer: PlayerInfo = {
          id: msg.playerId,
          name: msg.name,
          carStyle: msg.carStyle,
          isHost: false,
          ping: 0,
        };
        this._players.push(newPlayer);
        // Enviar roster actualizado a todos
        this.broadcast({ type: "roster", players: this._players });
        this.cb.onRosterUpdate(this._players);
        break;
      }

      case "roster": {
        // Solo los guests reciben esto
        this._players = msg.players;
        this.cb.onRosterUpdate(this._players);
        break;
      }

      case "start": {
        this.cb.onStart();
        break;
      }

      case "state": {
        // Procesar el estado localmente
        this.cb.onState(msg);
        
        // Si soy HOST, reenviar (relay) el estado a todos los demás peers
        if (this._role === "host") {
          for (const [peerId, peerConn] of this.connections.entries()) {
            if (peerId !== conn.peer) {
              this.send(peerConn, msg);
            }
          }
        }
        break;
      }

      case "win": {
        this.cb.onWin(msg.playerId, msg.name);
        // Si soy HOST, reenviar el mensaje de victoria a todos los demás
        if (this._role === "host") {
          for (const [peerId, peerConn] of this.connections.entries()) {
            if (peerId !== conn.peer) {
              this.send(peerConn, msg);
            }
          }
        }
        break;
      }

      case "ping": {
        this.send(conn, { type: "pong", ts: msg.ts });
        break;
      }

      case "pong": {
        const rtt = Date.now() - msg.ts;
        const player = this._players.find((p) => p.id === conn.peer);
        if (player) player.ping = Math.round(rtt / 2);
        break;
      }
    }
  }

  private broadcast(msg: NetMsg): void {
    for (const conn of this.connections.values()) {
      this.send(conn, msg);
    }
  }

  private send(conn: DataConnection, msg: NetMsg): void {
    if (conn.open) conn.send(msg);
  }

  private schedulePing(conn: DataConnection): void {
    const interval = window.setInterval(() => {
      if (!conn.open) {
        window.clearInterval(interval);
        return;
      }
      this.send(conn, { type: "ping", ts: Date.now() });
    }, 2000);
    this._pingTimers.set(conn.peer, interval);
  }
}
