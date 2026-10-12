export type TowerKind = "arrow" | "cannon" | "frost" | "sniper" | "tesla";

export type TowerShape = "triangle" | "square" | "circle" | "diamond" | "hexagon";

export interface TowerStats {
  damage: number;
  range: number;
  fireRate: number;
  projectileSpeed: number;
  splash?: number;
  slowFactor?: number;
  slowDuration?: number;
  chain?: number;
}

export interface TowerDef {
  kind: TowerKind;
  name: string;
  shape: TowerShape;
  description: string;
  buildCost: number;
  upgradeCosts: [number, number];
  levels: [TowerStats, TowerStats, TowerStats];
  unlockWave: number;
}

export const MAX_TOWER_LEVEL = 3;

export const TOWERS: Record<TowerKind, TowerDef> = {
  arrow: {
    kind: "arrow",
    name: "Flecha",
    shape: "triangle",
    description: "Torreta equilibrada de un solo objetivo.",
    buildCost: 50,
    upgradeCosts: [40, 80],
    unlockWave: 1,
    levels: [
      { damage: 8, range: 110, fireRate: 1.5, projectileSpeed: 340 },
      { damage: 14, range: 125, fireRate: 1.8, projectileSpeed: 360 },
      { damage: 24, range: 145, fireRate: 2.2, projectileSpeed: 380 },
    ],
  },
  cannon: {
    kind: "cannon",
    name: "Cañón",
    shape: "square",
    description: "Dispara obuses que dañan en área. Cadencia baja.",
    buildCost: 80,
    upgradeCosts: [70, 130],
    unlockWave: 2,
    levels: [
      { damage: 16, range: 95, fireRate: 0.7, projectileSpeed: 220, splash: 45 },
      { damage: 28, range: 105, fireRate: 0.8, projectileSpeed: 230, splash: 55 },
      { damage: 46, range: 115, fireRate: 0.9, projectileSpeed: 240, splash: 65 },
    ],
  },
  frost: {
    kind: "frost",
    name: "Escarcha",
    shape: "circle",
    description: "Ralentiza a los enemigos con poco daño.",
    buildCost: 70,
    upgradeCosts: [60, 110],
    unlockWave: 3,
    levels: [
      { damage: 3, range: 100, fireRate: 1.0, projectileSpeed: 260, slowFactor: 0.5, slowDuration: 1.5 },
      { damage: 5, range: 115, fireRate: 1.0, projectileSpeed: 270, slowFactor: 0.4, slowDuration: 1.8 },
      { damage: 8, range: 130, fireRate: 1.0, projectileSpeed: 280, slowFactor: 0.3, slowDuration: 2.2 },
    ],
  },
  sniper: {
    kind: "sniper",
    name: "Francotirador",
    shape: "diamond",
    description: "Alcance y daño enormes, pero dispara despacio.",
    buildCost: 120,
    upgradeCosts: [110, 200],
    unlockWave: 6,
    levels: [
      { damage: 55, range: 240, fireRate: 0.5, projectileSpeed: 700 },
      { damage: 95, range: 280, fireRate: 0.55, projectileSpeed: 760 },
      { damage: 160, range: 320, fireRate: 0.6, projectileSpeed: 820 },
    ],
  },
  tesla: {
    kind: "tesla",
    name: "Tesla",
    shape: "hexagon",
    description: "Rayo instantáneo que salta entre varios enemigos.",
    buildCost: 150,
    upgradeCosts: [130, 240],
    unlockWave: 10,
    levels: [
      { damage: 20, range: 120, fireRate: 1.2, projectileSpeed: 900, chain: 3 },
      { damage: 34, range: 135, fireRate: 1.4, projectileSpeed: 900, chain: 4 },
      { damage: 56, range: 150, fireRate: 1.6, projectileSpeed: 900, chain: 5 },
    ],
  },
};

export const TOWER_ORDER: TowerKind[] = ["arrow", "cannon", "frost", "sniper", "tesla"];

export function towerStats(kind: TowerKind, level: number): TowerStats {
  const def = TOWERS[kind];
  const idx = Math.min(Math.max(level, 1), MAX_TOWER_LEVEL) - 1;
  return def.levels[idx];
}
