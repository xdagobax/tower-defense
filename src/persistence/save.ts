import type { TowerKind } from "../config/towers";
import { createPermanentProgress, type PermanentProgress } from "../config/progression";
import { setMapLevel } from "../config/map";
import type { Game } from "../game";

const KEY = "tower-defense.save.v1";
interface TowerSnapshot { kind: TowerKind; col: number; row: number; level: number; invested: number; }
interface Snapshot { gold: number; lives: number; wave: number; towers: TowerSnapshot[]; }
interface SaveData { version: 2; bestWave: number; level: number; progress: PermanentProgress; snapshot?: Snapshot; }
function storage(): Storage | null {
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
}
export function persistGame(game: Game): void {
  const store = storage();
  if (!store) return;
  const data: SaveData = { version: 2, bestWave: game.bestWave, level: game.level, progress: game.progress };
  if (game.state.phase === "build" || game.state.phase === "defending") {
    data.snapshot = { gold: game.state.gold, lives: game.state.lives, wave: game.state.wave,
      towers: game.towers.map(t => ({ kind: t.kind, col: t.col, row: t.row, level: t.level, invested: t.invested })) };
  }
  try { store.setItem(KEY, JSON.stringify(data)); } catch { /* almacenamiento no disponible */ }
}
export function loadIntoGame(game: Game): void {
  const store = storage();
  if (!store) return;
  let parsed: unknown;
  try { parsed = JSON.parse(store.getItem(KEY) ?? "null"); } catch { return; }
  if (!parsed || typeof parsed !== "object") return;
  const data = parsed as { version?: number; bestWave?: number; level?: number; progress?: Partial<PermanentProgress>; snapshot?: Snapshot };
  if (data.version !== 1 && data.version !== 2) return;
  game.bestWave = Math.max(0, Number(data.bestWave) || 0);
  if (data.version === 2 && data.progress && typeof data.progress === "object") {
    const fresh = createPermanentProgress();
    const p = data.progress;
    game.progress = {
      experience: Math.max(0, Math.floor(Number(p.experience) || 0)),
      highestUnlockedLevel: Math.max(1, Math.floor(Number(p.highestUnlockedLevel) || 1)),
      bestWaveByLevel: p.bestWaveByLevel && typeof p.bestWaveByLevel === "object" ? p.bestWaveByLevel : fresh.bestWaveByLevel,
      upgrades: p.upgrades && typeof p.upgrades === "object" ? p.upgrades : fresh.upgrades,
    };
    game.level = Math.min(game.progress.highestUnlockedLevel, Math.max(1, Math.floor(Number(data.level) || 1)));
    setMapLevel(game.level);
  }
  if (!data.snapshot) return;
  const snap = data.snapshot;
  game.state.wave = Math.max(1, Math.floor(Number(snap.wave) || 1));
  game.state.gold = Number.MAX_SAFE_INTEGER;
  for (const tower of snap.towers ?? []) {
    if (game.placeTower(tower.col, tower.row, tower.kind)) {
      const placed = game.towers[game.towers.length - 1];
      placed.level = tower.level;
      placed.invested = tower.invested;
    }
  }
  game.state.gold = Math.max(0, Number(snap.gold) || 0);
  game.state.lives = Math.max(0, Number(snap.lives) || game.state.maxLives);
}
export function clearPersisted(): void {
  const store = storage();
  if (!store) return;
  try { store.removeItem(KEY); } catch { /* ignore */ }
}
