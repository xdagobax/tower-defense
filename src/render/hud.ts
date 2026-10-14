import { TOWERS, TOWER_ORDER, MAX_TOWER_LEVEL, type TowerKind } from "../config/towers";
import type { Game } from "../game";
import { buildCost, canAfford, sellValue, upgradeCost } from "../systems/economy";
import { upgradeCost as permanentUpgradeCost, type UpgradeId } from "../config/progression";

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
  onNewGame(): void;
  onSelectLevel(level: number): void;
  onPurchaseUpgrade(id: UpgradeId): void;
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
  private readonly levelSelect = must<HTMLSelectElement>("level-select");
  private readonly levelStatus = must("level-status");
  private readonly xpCount = must("xp-count");
  private readonly compactGold = must("compact-gold");
  private readonly compactLives = must("compact-lives");
  private readonly compactWave = must("compact-wave");
  private readonly compactXp = must("compact-xp");
  private readonly statsPanel = must("stats-panel");
  private readonly statsToggle = must<HTMLButtonElement>("btn-stats-toggle");
  private readonly statsToggleIcon = must("stats-toggle-icon");
  private readonly permanentList = must("permanent-upgrades");
  private readonly newGameBtn = must<HTMLButtonElement>("btn-new-game");
  private readonly permanentButtons = new Map<UpgradeId, HTMLButtonElement>();
  private renderedLevelCount = 0;

  private readonly towerButtons = new Map<TowerKind, HTMLButtonElement>();
  // Keep action buttons mounted between frames; recreating them every frame
  // prevents the browser from completing a normal click reliably.
  private renderedSelectionKey = "";

  constructor(
    private readonly game: Game,
    private readonly handlers: HudHandlers,
  ) {
    this.statsToggle.addEventListener("click", () => {
      const collapsed = this.statsPanel.classList.toggle("is-collapsed");
      this.statsToggle.setAttribute("aria-expanded", String(!collapsed));
      this.statsToggleIcon.textContent = collapsed ? "＋" : "−";
    });
    this.buildTowerButtons();
    this.startBtn.addEventListener("click", () => this.handlers.onStartWave());
    this.pauseBtn.addEventListener("click", () => this.handlers.onTogglePause());
    this.speedBtn.addEventListener("click", () => this.handlers.onToggleSpeed());
    this.restartBtn.addEventListener("click", () => this.handlers.onRestart());
    this.newGameBtn.addEventListener("click", () => this.handlers.onNewGame());
    this.levelSelect.addEventListener("change", () => {
      this.handlers.onSelectLevel(Number(this.levelSelect.value));
      this.activateTab("game");
    });
    this.buildPermanentButtons();
    document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => this.activateTab(button.dataset.tab ?? "home"));
    });
  }

  private activateTab(name: string): void {
    for (const button of document.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
      const active = button.dataset.tab === name;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    }
    for (const panel of document.querySelectorAll<HTMLElement>(".tab-panel")) {
      panel.hidden = panel.id !== "panel-" + name;
    }
  }

  private buildPermanentButtons(): void {
    const ids: UpgradeId[] = ["startingGold", "killGold"];
    for (const kind of TOWER_ORDER) ids.push(("damage:" + kind) as UpgradeId, ("fireRate:" + kind) as UpgradeId);
    for (const id of ids) {
      const btn = document.createElement("button");
      btn.dataset.upgrade = id;
      btn.addEventListener("click", () => this.handlers.onPurchaseUpgrade(id));
      this.permanentList.appendChild(btn);
      this.permanentButtons.set(id, btn);
    }
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
    this.wave.textContent = `${state.wave} · meta ${10 + (this.game.level - 1) * 5}`;
    this.phase.textContent = PHASE_LABELS[state.phase] ?? state.phase;
    this.phase.className = state.phase === "build" ? "phase-build" : "";
    this.compactGold.textContent = String(state.gold);
    this.compactLives.textContent = String(state.lives);
    this.compactWave.textContent = String(state.wave);
    this.compactXp.textContent = String(this.game.progress.experience);
    // La navegación siempre está disponible fuera de Partida. Dentro de Partida,
    // solo se muestra durante la pausa o antes de iniciar la primera oleada.
    const activeTab = document.querySelector<HTMLButtonElement>("[data-tab][aria-selected=\"true\"]")?.dataset.tab ?? "home";
    const showNavigation = activeTab !== "game" || state.paused || (state.phase === "build" && state.wave === 1) || state.phase === "gameover" || state.phase === "victory";
    document.body.classList.toggle("navigation-hidden", !showNavigation);

    // Los controles secundarios se ocultan durante la partida activa.
    const showSecondaryControls = state.paused || (state.phase === "build" && state.wave === 1) || state.phase === "gameover" || state.phase === "victory";
    document.body.classList.toggle("gameplay-focused", !showSecondaryControls);

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

    // Mostrar niveles futuros bloqueados para que la progresión sea visible sin permitir saltárselos.
    const visibleLevelCount = this.game.progress.highestUnlockedLevel + 9;
    if (this.renderedLevelCount !== visibleLevelCount) {
      this.levelSelect.innerHTML = "";
      for (let level = 1; level <= visibleLevelCount; level++) {
        const option = document.createElement("option");
        option.value = String(level);
        option.disabled = level > this.game.progress.highestUnlockedLevel;
        option.textContent = level > this.game.progress.highestUnlockedLevel
          ? `🔒 Nivel ${level} · supera el anterior`
          : "Nivel " + level;
        this.levelSelect.appendChild(option);
      }
      this.renderedLevelCount = visibleLevelCount;
    }
    if (this.levelSelect.value !== String(this.game.level)) this.levelSelect.value = String(this.game.level);
    this.levelStatus.textContent = "Récord: " + (this.game.progress.bestWaveByLevel[this.game.level] ?? 0) + ". Meta: oleada " + (10 + (this.game.level - 1) * 5) + "; puedes seguir jugando después."; 
    this.xpCount.textContent = String(this.game.progress.experience);
    const upgradeXp = document.getElementById("upgrade-xp-count");
    if (upgradeXp) upgradeXp.textContent = String(this.game.progress.experience);
    for (const [id, btn] of this.permanentButtons) {
      const count = this.game.progress.upgrades[id] ?? 0;
      const labels: Record<string, string> = { startingGold: "Oro inicial", killGold: "Oro por enemigo" };
      const parts = id.split(":");
      const name = labels[id] ?? ((parts[0] === "damage" ? "Daño" : "Cadencia") + " · " + (TOWERS[parts[1] as TowerKind]?.name ?? parts[1]));
      const cost = permanentUpgradeCost(id, count);
      btn.textContent = count >= 10 ? name + ": máximo" : name + ": nivel " + count + " · " + cost + " XP";
      btn.disabled = count >= 10 || this.game.progress.experience < cost;
    }
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
