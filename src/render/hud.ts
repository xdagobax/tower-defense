import { TOWERS, TOWER_ORDER, MAX_TOWER_LEVEL, type TowerKind } from "../config/towers";
import type { Game } from "../game";
import { buildCost, canAfford, sellValue, upgradeCost } from "../systems/economy";

const SYMBOLS: Record<TowerKind, string> = {
  arrow: "▲",
  cannon: "■",
  frost: "●",
  sniper: "◆",
  tesla: "⬢",
};

const PHASE_LABELS: Record<string, string> = {
  build: "Construir",
  defending: "Defendiendo",
  gameover: "Derrota",
  victory: "Victoria",
};

export interface HudHandlers {
  onSelectKind(kind: TowerKind): void;
  onStartWave(): void;
  onTogglePause(): void;
  onToggleSpeed(): void;
  onRestart(): void;
  onUpgrade(): void;
  onSell(): void;
}

function must<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta el elemento #${id}`);
  return el as T;
}

export class Hud {
  private readonly gold = must("stat-gold");
  private readonly lives = must("stat-lives");
  private readonly wave = must("stat-wave");
  private readonly phase = must("stat-phase");
  private readonly message = must("message");
  private readonly selection = must("selection");
  private readonly startBtn = must<HTMLButtonElement>("btn-start");
  private readonly pauseBtn = must<HTMLButtonElement>("btn-pause");
  private readonly speedBtn = must<HTMLButtonElement>("btn-speed");
  private readonly restartBtn = must<HTMLButtonElement>("btn-restart");
  private readonly towerList = must("tower-list");

  private readonly towerButtons = new Map<TowerKind, HTMLButtonElement>();
  // Keep action buttons mounted between frames; recreating them every frame
  // prevents the browser from completing a normal click reliably.
  private renderedSelectionKey = "";

  constructor(
    private readonly game: Game,
    private readonly handlers: HudHandlers,
  ) {
    this.buildTowerButtons();
    this.startBtn.addEventListener("click", () => this.handlers.onStartWave());
    this.pauseBtn.addEventListener("click", () => this.handlers.onTogglePause());
    this.speedBtn.addEventListener("click", () => this.handlers.onToggleSpeed());
    this.restartBtn.addEventListener("click", () => this.handlers.onRestart());
  }

  private buildTowerButtons(): void {
    for (const kind of TOWER_ORDER) {
      const def = TOWERS[kind];
      const btn = document.createElement("button");
      btn.dataset.kind = kind;
      btn.innerHTML = `${SYMBOLS[kind]} ${def.name}<br><small>${def.buildCost} oro</small>`;
      btn.title = def.description;
      btn.addEventListener("click", () => this.handlers.onSelectKind(kind));
      this.towerList.appendChild(btn);
      this.towerButtons.set(kind, btn);
    }
  }

  update(): void {
    const state = this.game.state;
    this.gold.textContent = String(state.gold);
    this.lives.textContent = String(state.lives);
    this.wave.textContent = `${state.wave}/${20}`;
    this.phase.textContent = PHASE_LABELS[state.phase] ?? state.phase;
    this.phase.className = state.phase === "build" ? "phase-build" : "";

    for (const kind of TOWER_ORDER) {
      const btn = this.towerButtons.get(kind);
      if (!btn) continue;
      const unlocked = this.game.isUnlocked(kind);
      const affordable = canAfford(state.gold, buildCost(kind));
      btn.disabled = !unlocked || !affordable;
      btn.classList.toggle("selected", state.selectedKind === kind && unlocked);
      if (!unlocked) {
        btn.innerHTML = `${SYMBOLS[kind]} ${TOWERS[kind].name}<br><small>Oleada ${TOWERS[kind].unlockWave}</small>`;
      }
    }

    this.startBtn.disabled = !this.game.canStartWave;
    const bonus = this.game.earlyWaveBonus;
    const windowText =
      bonus > 0
        ? ` (+${bonus} oro · ${Math.ceil(this.game.earlyWaveWindowRemaining)}s)`
        : "";
    if (state.phase === "build") {
      this.startBtn.textContent = `Iniciar oleada ${state.wave}${windowText}`;
    } else if (this.game.canStartWave) {
      this.startBtn.textContent = `Llamar oleada ${state.wave + 1}${windowText || " (sin bonus)"}`;
    } else {
      this.startBtn.textContent = "Oleada en curso";
    }
    this.pauseBtn.textContent = state.paused ? "Reanudar" : "Pausa";
    this.speedBtn.textContent = `Velocidad x${state.speed}`;

    this.updateSelection();
    this.message.textContent = this.game.messages[this.game.messages.length - 1] ?? "";
  }

  private updateSelection(): void {
    const state = this.game.state;
    const tower = this.game.towers.find((t) => t.id === state.selectedTowerId);

    if (!tower) {
      if (this.renderedSelectionKey !== "none") {
        this.selection.innerHTML = `<div class="label">Sin selección</div>`;
        this.renderedSelectionKey = "none";
      }
      return;
    }

    const def = TOWERS[tower.kind];
    const stats = def.levels[tower.level - 1];
    const nextCost = upgradeCost(tower.kind, tower.level);
    const sold = sellValue(tower.invested);
    const selectionKey = `${tower.id}:${tower.level}:${tower.invested}`;

    // Rebuild only when the selected tower or its level changes, not on every
    // animation frame. Otherwise the upgrade button is continuously detached
    // before its click event can be dispatched.
    if (this.renderedSelectionKey !== selectionKey) {
      const upgradeLine =
        tower.level >= MAX_TOWER_LEVEL
          ? "Nivel máximo"
          : `Mejora: ${nextCost} oro`;

      this.selection.innerHTML = `
        <div class="label">${SYMBOLS[tower.kind]} ${def.name} · Nivel ${tower.level}</div>
        <div class="row"><span>Daño</span><span>${stats.damage}</span></div>
        <div class="row"><span>Alcance</span><span>${Math.round(stats.range)}</span></div>
        <div class="row"><span>Cadencia</span><span>${stats.fireRate}/s</span></div>
        <div class="actions"></div>
      `;
      const actions = this.selection.querySelector(".actions") as HTMLDivElement;

      const upgradeBtn = document.createElement("button");
      upgradeBtn.dataset.action = "upgrade";
      upgradeBtn.textContent = upgradeLine;
      upgradeBtn.addEventListener("click", () => this.handlers.onUpgrade());

      const sellBtn = document.createElement("button");
      sellBtn.dataset.action = "sell";
      sellBtn.addEventListener("click", () => this.handlers.onSell());

      actions.append(upgradeBtn, sellBtn);
      this.renderedSelectionKey = selectionKey;
    }

    const upgradeBtn = this.selection.querySelector<HTMLButtonElement>('[data-action="upgrade"]');
    const sellBtn = this.selection.querySelector<HTMLButtonElement>('[data-action="sell"]');
    if (upgradeBtn) {
      upgradeBtn.disabled =
        tower.level >= MAX_TOWER_LEVEL || !canAfford(state.gold, nextCost ?? Infinity);
    }
    if (sellBtn) sellBtn.textContent = `Vender ${sold}`;
  }
}
