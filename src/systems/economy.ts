import { MAX_TOWER_LEVEL, TOWERS, type TowerKind } from "../config/towers";

export function canAfford(gold: number, cost: number): boolean {
  return gold >= cost;
}

export function sellValue(invested: number): number {
  return Math.floor(invested * 0.5);
}

export function buildCost(kind: TowerKind): number {
  return TOWERS[kind].buildCost;
}

export function upgradeCost(kind: TowerKind, currentLevel: number): number | null {
  if (currentLevel >= MAX_TOWER_LEVEL) return null;
  return TOWERS[kind].upgradeCosts[currentLevel - 1];
}
