import type { EnemyKind } from "./config/enemies";
import type { TowerKind } from "./config/towers";

export type GamePhase = "build" | "defending" | "gameover" | "victory";

export interface Enemy {
  id: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  baseSpeed: number;
  reward: number;
  armor: number;
  size: number;
  distance: number;
  slowTimer: number;
  slowFactor: number;
  alive: boolean;
  reachedBase: boolean;
}

export interface Tower {
  id: number;
  kind: TowerKind;
  col: number;
  row: number;
  level: number;
  cooldown: number;
  invested: number;
  angle: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetId: number;
  speed: number;
  damage: number;
  kind: TowerKind;
  splash?: number;
  slowFactor?: number;
  slowDuration?: number;
  chain?: number;
  dead: boolean;
}

export interface QueuedSpawn {
  kind: EnemyKind;
  at: number;
}

export interface GameState {
  phase: GamePhase;
  gold: number;
  lives: number;
  maxLives: number;
  wave: number;
  speed: number;
  paused: boolean;
  selectedKind: TowerKind | null;
  selectedTowerId: number | null;
}
