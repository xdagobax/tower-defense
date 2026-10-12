import type { TowerKind } from "../config/towers";
import type { Game } from "../game";

const KEY = "tower-defense.save.v1";

interface TowerSnapshot {
  kind: TowerKind;
  col: number;
  row: number;
  level: number;
  invested: number;
}

interface SaveData {
  version: 1;
  bestWave: number;
  snapshot?: {
    gold: number;
    lives: number;
    wave: number;
    towers: TowerSnapshot[];
  };
}

function storage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function persistGame(game: Game): void {
  const store = storage();
  if (!store) return;
  const data: SaveData = {
    version: 1,
    bestWave: game.bestWave,
  };
  if (game.state.phase === "build" || game.state.phase === "defending") {
    data.snapshot = {
      gold: game.state.gold,
      lives: game.state.lives,
      wave: game.state.wave,
      towers: game.towers.map((t) => ({
        kind: t.kind,
        col: t.col,
        row: t.row,
        level: t.level,
        invested: t.invested,
      })),
    };
  }
  try {
    store.setItem(KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function loadIntoGame(game: Game): void {
  const store = storage();
  if (!store) return;
  const raw = store.getItem(KEY);
  if (!raw) return;
  let data: SaveData;
  try {
    data = JSON.parse(raw) as SaveData;
  } catch {
    return;
  }
  if (!data || data.version !== 1) return;
  game.bestWave = data.bestWave ?? 0;

  if (!data.snapshot) return;
  const snap = data.snapshot;
  game.state.wave = snap.wave;
  game.state.gold = Number.MAX_SAFE_INTEGER;
  for (const tower of snap.towers) {
    if (game.placeTower(tower.col, tower.row, tower.kind)) {
      const placed = game.towers[game.towers.length - 1];
      placed.level = tower.level;
      placed.invested = tower.invested;
    }
  }
  game.state.gold = snap.gold;
  game.state.lives = snap.lives;
}

export function clearPersisted(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
