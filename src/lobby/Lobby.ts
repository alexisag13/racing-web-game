/**
 * Lobby.ts — Controlador del lobby pre-carrera
 */

import { NetworkManager, type CarStyleId, type PlayerInfo } from "./network";
import { CAR_DEFS } from "../game/carVisuals";

export interface LobbyResult {
  carStyle: CarStyleId;
  playerName: string;
  network: NetworkManager | null;
  isHost: boolean;
}

export class Lobby {
  private selectedCar: CarStyleId = 0;
  private playerName = "Jugador";
  private network: NetworkManager | null = null;
  private resolve: ((r: LobbyResult) => void) | null = null;

  show(): Promise<LobbyResult> {
    return new Promise((res) => {
      this.resolve = res;
      this.renderMain();
    });
  }

  // ── Pantallas ─────────────────────────────────────────────────

  private renderMain(): void {
    this.setContent(`
      <div class="lb-screen" id="lb-main">
        <div class="lb-logo">
          <span class="lb-logo-text">RACE<span class="lb-logo-accent">X</span></span>
          <span class="lb-logo-sub">MULTIPLAYER RACING</span>
        </div>

        <div class="lb-name-row">
          <label class="lb-label">TU NOMBRE</label>
          <input id="lb-name" class="lb-input" maxlength="16"
            placeholder="Jugador" value="${this.escHtml(this.playerName)}" />
        </div>

        <div class="lb-section-title">ELIGE TU AUTO</div>
        <div class="lb-cars" id="lb-cars">
          ${CAR_DEFS.map((c) => this.carCard(c)).join("")}
        </div>

        <div class="lb-actions">
          <button class="lb-btn lb-btn-solo" id="lb-solo">
            <span class="lb-btn-icon">🏁</span> JUGAR SOLO
          </button>
          <button class="lb-btn lb-btn-host" id="lb-host">
            <span class="lb-btn-icon">📡</span> CREAR SALA
          </button>
          <button class="lb-btn lb-btn-join" id="lb-join">
            <span class="lb-btn-icon">🔗</span> UNIRSE
          </button>
        </div>
      </div>
    `);

    document.querySelectorAll<HTMLElement>(".lb-car-card").forEach((el) => {
      el.addEventListener("click", () => {
        this.selectedCar = Number(el.dataset["carId"]) as CarStyleId;
        document.querySelectorAll(".lb-car-card").forEach((c) => c.classList.remove("selected"));
        el.classList.add("selected");
      });
    });

    document.querySelector(`[data-car-id="${this.selectedCar}"]`)?.classList.add("selected");

    document.getElementById("lb-name")?.addEventListener("input", (e) => {
      this.playerName = (e.target as HTMLInputElement).value.trim() || "Jugador";
    });

    document.getElementById("lb-solo")?.addEventListener("click", () => this.startSolo());
    document.getElementById("lb-host")?.addEventListener("click", () => this.renderCreateRoom());
    document.getElementById("lb-join")?.addEventListener("click", () => this.renderJoinRoom());
  }

  private renderCreateRoom(): void {
    this.setContent(`
      <div class="lb-screen" id="lb-create">
        <button class="lb-back" id="lb-back">← Volver</button>
        <div class="lb-section-title">CREAR SALA</div>
        <div class="lb-info-text">Conectando al servidor de señalización…</div>
        <div class="lb-spinner"></div>
      </div>
    `);

    document.getElementById("lb-back")?.addEventListener("click", () => this.renderMain());

    this.network = new NetworkManager({
      onRosterUpdate: (players) => this.updateWaitingRoom(players),
      onStart: () => this.launchRace(),
      onState: () => {},
      onWin: () => {},
      onError: (msg) => this.showError(msg),
      onConnected: () => {},
    });

    this.network.createRoom(this.playerName, this.selectedCar)
      .then((code) => this.renderWaitingRoom(code, true))
      .catch((e: unknown) => this.showError(String(e)));
  }

  private renderJoinRoom(): void {
    this.setContent(`
      <div class="lb-screen" id="lb-join-screen">
        <button class="lb-back" id="lb-back">← Volver</button>
        <div class="lb-section-title">UNIRSE A SALA</div>
        <div class="lb-info-text">Ingresa el código que te dio el host:</div>
        <input id="lb-code" class="lb-input lb-code-input"
          maxlength="24" placeholder="Código de sala" autocomplete="off" />
        <button class="lb-btn lb-btn-host" id="lb-connect" style="margin-top:18px">
          CONECTAR
        </button>
        <div id="lb-join-status" class="lb-status-text"></div>
      </div>
    `);

    document.getElementById("lb-back")?.addEventListener("click", () => this.renderMain());
    document.getElementById("lb-connect")?.addEventListener("click", () => this.doJoin());
    document.getElementById("lb-code")?.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") this.doJoin();
    });
  }

  private doJoin(): void {
    const code = (document.getElementById("lb-code") as HTMLInputElement)?.value.trim();
    if (!code) return;

    const statusEl = document.getElementById("lb-join-status");
    if (statusEl) statusEl.textContent = "Conectando…";

    const btn = document.getElementById("lb-connect") as HTMLButtonElement | null;
    if (btn) btn.disabled = true;

    this.network = new NetworkManager({
      onRosterUpdate: (players) => this.updateWaitingRoom(players),
      onStart: () => this.launchRace(),
      onState: () => {},
      onWin: () => {},
      onError: (msg) => this.showError(msg),
      onConnected: () => {},
    });

    this.network.joinRoom(code, this.playerName, this.selectedCar)
      .then(() => this.renderWaitingRoom(code, false))
      .catch((e: unknown) => {
        if (statusEl) statusEl.textContent = `Error: ${String(e)}`;
        if (btn) btn.disabled = false;
      });
  }

  private renderWaitingRoom(code: string, isHost: boolean): void {
    this.setContent(`
      <div class="lb-screen" id="lb-waiting">
        ${isHost ? `<button class="lb-back" id="lb-back">← Cancelar</button>` : ""}
        <div class="lb-section-title">${isHost ? "SALA CREADA" : "SALA DE ESPERA"}</div>

        ${isHost ? `
          <div class="lb-code-box">
            <div class="lb-code-label">CÓDIGO DE SALA</div>
            <div class="lb-code-value" id="lb-code-display">${this.escHtml(code)}</div>
            <button class="lb-copy-btn" id="lb-copy">📋 Copiar</button>
          </div>
          <div class="lb-info-text">Comparte este código con los otros jugadores (máx. 3 en total)</div>
        ` : `
          <div class="lb-info-text">Conectado. Esperando que el host inicie la carrera…</div>
        `}

        <div class="lb-section-title" style="margin-top:24px">JUGADORES</div>
        <div class="lb-player-list" id="lb-player-list">
          <div class="lb-player-row lb-loading">Esperando jugadores…</div>
        </div>

        ${isHost ? `
          <button class="lb-btn lb-btn-start" id="lb-start" disabled>
            🏁 INICIAR CARRERA
          </button>
          <div class="lb-info-text" style="margin-top:8px;font-size:11px;opacity:0.6">
            Mínimo 2 jugadores para iniciar
          </div>
        ` : ""}
      </div>
    `);

    document.getElementById("lb-back")?.addEventListener("click", () => {
      this.network?.disconnect();
      this.network = null;
      this.renderMain();
    });

    document.getElementById("lb-copy")?.addEventListener("click", () => {
      void navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById("lb-copy");
        if (btn) {
          btn.textContent = "✓ Copiado";
          setTimeout(() => { btn.textContent = "📋 Copiar"; }, 1500);
        }
      });
    });

    document.getElementById("lb-start")?.addEventListener("click", () => {
      this.network?.startRace();
    });

    if (this.network) this.updateWaitingRoom(this.network.players);
  }

  private updateWaitingRoom(players: PlayerInfo[]): void {
    const list = document.getElementById("lb-player-list");
    if (!list) return;

    list.innerHTML = players.map((p) => {
      const car = CAR_DEFS[p.carStyle] ?? CAR_DEFS[0]!;
      return `
        <div class="lb-player-row">
          <div class="lb-player-dot" style="background:${car.color};box-shadow:0 0 8px ${car.accent}"></div>
          <div class="lb-player-name">${this.escHtml(p.name)}${p.isHost ? " 👑" : ""}</div>
          <div class="lb-player-car">${car.name}</div>
          <div class="lb-player-ping">${p.ping > 0 ? `${p.ping}ms` : "—"}</div>
        </div>
      `;
    }).join("");

    const startBtn = document.getElementById("lb-start") as HTMLButtonElement | null;
    if (startBtn) startBtn.disabled = players.length < 2;
  }

  // ── Acciones ──────────────────────────────────────────────────

  private startSolo(): void {
    this.resolve?.({
      carStyle: this.selectedCar,
      playerName: this.playerName,
      network: null,
      isHost: true,
    });
    this.hide();
  }

  private launchRace(): void {
    if (!this.network) return;
    this.resolve?.({
      carStyle: this.selectedCar,
      playerName: this.playerName,
      network: this.network,
      isHost: this.network.role === "host",
    });
    this.hide();
  }

  // ── Helpers ───────────────────────────────────────────────────

  private showError(msg: string): void {
    const existing = document.getElementById("lb-error-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "lb-error-toast";
    toast.className = "lb-error-toast";
    toast.textContent = `⚠ ${msg}`;
    document.getElementById("lb-overlay")?.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  private carCard(c: typeof CAR_DEFS[number]): string {
    // SVG genérico de auto de perfil con el color del auto
    return `
      <div class="lb-car-card" data-car-id="${c.id}">
        <div class="lb-car-preview" style="
          background: radial-gradient(ellipse at 40% 35%, ${c.accent}33, transparent 70%),
                      linear-gradient(135deg, ${c.color}22, ${c.color}44);
          border-color: ${c.color}66;
        ">
          <svg viewBox="0 0 100 50" class="lb-car-svg">
            <!-- Sombra -->
            <ellipse cx="50" cy="44" rx="36" ry="4" fill="rgba(0,0,0,0.35)"/>
            <!-- Carrocería baja -->
            <path d="M14,32 Q14,38 22,38 L78,38 Q86,38 86,32 L86,26 Q86,22 80,22 L20,22 Q14,22 14,26 Z"
              fill="${c.color}" opacity="0.95"/>
            <!-- Cabina -->
            <path d="M32,22 Q34,12 42,11 L58,11 Q66,12 68,22 Z"
              fill="${c.color}" opacity="0.85"/>
            <!-- Vidrio -->
            <path d="M35,22 Q37,14 43,13 L57,13 Q63,14 65,22 Z"
              fill="rgba(160,220,255,0.35)"/>
            <!-- Alerón trasero -->
            <rect x="10" y="20" width="12" height="3" rx="1.5" fill="${c.accent}" opacity="0.9"/>
            <rect x="10" y="18" width="12" height="2" rx="1" fill="${c.accent}" opacity="0.6"/>
            <!-- Alerón delantero -->
            <rect x="78" y="24" width="12" height="2" rx="1" fill="${c.accent}" opacity="0.9"/>
            <!-- Rueda trasera -->
            <circle cx="26" cy="38" r="8" fill="#111"/>
            <circle cx="26" cy="38" r="5" fill="#2a2a2a"/>
            <circle cx="26" cy="38" r="2.5" fill="${c.accent}" opacity="0.7"/>
            <!-- Rueda delantera -->
            <circle cx="72" cy="38" r="8" fill="#111"/>
            <circle cx="72" cy="38" r="5" fill="#2a2a2a"/>
            <circle cx="72" cy="38" r="2.5" fill="${c.accent}" opacity="0.7"/>
            <!-- Brillo carrocería -->
            <path d="M30,24 Q50,20 70,24" stroke="rgba(255,255,255,0.18)" stroke-width="2" fill="none"/>
            <!-- Número -->
            <text x="50" y="33" text-anchor="middle" font-size="8"
              font-family="Orbitron,monospace" font-weight="900"
              fill="white" opacity="0.65">${c.id + 1}</text>
          </svg>
        </div>
        <div class="lb-car-name" style="color:${c.accent}">${c.name}</div>
      </div>
    `;
  }

  private setContent(html: string): void {
    const overlay = document.getElementById("lb-overlay");
    if (overlay) overlay.innerHTML = html;
  }

  private hide(): void {
    const overlay = document.getElementById("lb-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
      setTimeout(() => { overlay.style.display = "none"; }, 400);
    }
  }

  private escHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

