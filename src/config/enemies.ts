export type EnemyKind = "basic" | "fast" | "tank" | "boss";

export type EnemyShape = "triangle" | "circle" | "square" | "hexagon";

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  shape: EnemyShape;
  hp: number;
  speed: number;
  reward: number;
  armor: number;
  size: number;
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  basic: {
    kind: "basic",
    name: "Básico",
    shape: "triangle",
    hp: 40,
    speed: 60,
    reward: 6,
    armor: 0,
    size: 12,
  },
  fast: {
    kind: "fast",
    name: "Rápido",
    shape: "circle",
    hp: 25,
    speed: 110,
    reward: 5,
    armor: 0,
    size: 9,
  },
  tank: {
    kind: "tank",
    name: "Tanque",
    shape: "square",
    hp: 140,
    speed: 35,
    reward: 14,
    armor: 3,
    size: 16,
  },
  boss: {
    kind: "boss",
    name: "Jefe",
    shape: "hexagon",
    hp: 900,
    speed: 30,
    reward: 80,
    armor: 6,
    size: 22,
  },
};
