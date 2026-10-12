import type { EnemyKind } from "./enemies";

export interface EnemyGroup {
  kind: EnemyKind;
  count: number;
  interval: number;
  delay: number;
}

export interface WaveDef {
  index: number;
  groups: EnemyGroup[];
  totalEnemies: number;
}

export function hpMultiplier(wave: number): number {
  return Math.pow(1.10, Math.max(0, wave - 1));
}

export function speedMultiplier(wave: number): number {
  return Math.min(1.8, 1 + 0.02 * Math.max(0, wave - 1));
}

export function rewardMultiplier(wave: number): number {
  return 1 + 0.05 * Math.max(0, wave - 1);
}

export function buildWave(wave: number): WaveDef {
  const w = Math.max(1, Math.floor(wave));
  const groups: EnemyGroup[] = [];

  groups.push({
    kind: "basic",
    count: 4 + Math.floor(w * 1.5),
    interval: Math.max(0.35, 0.8 - w * 0.02),
    delay: 0,
  });

  if (w >= 3) {
    groups.push({
      kind: "fast",
      count: 2 + Math.floor(w * 0.7),
      interval: Math.max(0.25, 0.5 - w * 0.01),
      delay: 1.5,
    });
  }

  if (w >= 6) {
    groups.push({
      kind: "tank",
      count: 1 + Math.floor((w - 4) / 2),
      interval: 1.6,
      delay: 3,
    });
  }

  if (w % 5 === 0) {
    groups.push({
      kind: "boss",
      count: Math.floor(w / 10) + 1,
      interval: 3,
      delay: 5,
    });
  }

  const totalEnemies = groups.reduce((sum, g) => sum + g.count, 0);
  return { index: w, groups, totalEnemies };
}

export function waveRewardBonus(wave: number): number {
  return 20 + Math.max(1, Math.floor(wave)) * 5;
}
