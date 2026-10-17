import type { TowerKind } from "./towers";

export const FIRST_LEVEL_TARGET_WAVE = 10;
export const WAVES_PER_LEVEL = 5;
export const LEVEL_DIFFICULTY_STEP = 0.12;
export const LEVEL_EXPERIENCE_STEP = 0.35;
export const EARLY_WAVE_EXPERIENCE_FACTOR = 0.25;
export const UPGRADE_COST_BASE = 100;
export const UPGRADE_COST_GROWTH = 1.5;
export const UPGRADE_EFFECT_STEP = 0.03;
export const UPGRADE_SOFT_CAP_LEVEL = 10;
export const UPGRADE_EFFECT_STEP_AFTER_CAP = 0.05;

export type UpgradeKind = "damage" | "fireRate" | "startingGold" | "killGold";
export type UpgradeId = UpgradeKind | `damage:${TowerKind}` | `fireRate:${TowerKind}`;

export interface PermanentProgress {
  experience: number;
  highestUnlockedLevel: number;
  bestWaveByLevel: Record<number, number>;
  upgrades: Partial<Record<UpgradeId, number>>;
}

export function createPermanentProgress(): PermanentProgress {
  return { experience: 0, highestUnlockedLevel: 1, bestWaveByLevel: {}, upgrades: {} };
}

export function levelTargetWave(level: number): number {
  return FIRST_LEVEL_TARGET_WAVE + (Math.max(1, Math.floor(level)) - 1) * WAVES_PER_LEVEL;
}

export function levelDifficultyMultiplier(level: number): number {
  return 1 + (Math.max(1, Math.floor(level)) - 1) * LEVEL_DIFFICULTY_STEP;
}

export function experienceForKill(level: number, wave: number, base = 1): number {
  const safeLevel = Math.max(1, Math.floor(level));
  const safeWave = Math.max(1, Math.floor(wave));
  const earlyPenalty = safeWave <= 3 ? EARLY_WAVE_EXPERIENCE_FACTOR : 1;
  const levelFactor = 1 + (safeLevel - 1) * LEVEL_EXPERIENCE_STEP;
  const waveFactor = 1 + Math.floor((safeWave - 1) / 5) * 0.2;
  const rawReward = base * earlyPenalty * levelFactor * waveFactor;
  return safeWave <= 3 ? Math.max(0, Math.floor(rawReward)) : Math.max(0, Math.ceil(rawReward));
}

export function experienceForWave(level: number, wave: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  const safeWave = Math.max(1, Math.floor(wave));
  return Math.max(1, Math.floor((safeLevel + Math.floor((safeWave - 1) / 5)) * 2));
}

export function upgradeCost(id: UpgradeId, currentLevel: number, base = UPGRADE_COST_BASE): number {
  void id;
  const level = Math.max(0, Math.floor(currentLevel));
  return Math.ceil(base * Math.pow(UPGRADE_COST_GROWTH, level));
}

export function upgradeMultiplier(level: number): number {
  const safeLevel = Math.max(0, Math.floor(level));
  const initialLevels = Math.min(safeLevel, UPGRADE_SOFT_CAP_LEVEL);
  const extraLevels = Math.max(0, safeLevel - UPGRADE_SOFT_CAP_LEVEL);
  return 1 + initialLevels * UPGRADE_EFFECT_STEP + extraLevels * UPGRADE_EFFECT_STEP_AFTER_CAP;
}

export function canPurchaseUpgrade(progress: PermanentProgress, id: UpgradeId, base?: number): boolean {
  return progress.experience >= upgradeCost(id, progress.upgrades[id] ?? 0, base);
}

export function purchaseUpgrade(
  progress: PermanentProgress,
  id: UpgradeId,
  base?: number,
): boolean {
  const currentLevel = progress.upgrades[id] ?? 0;
  const cost = upgradeCost(id, currentLevel, base);
  if (progress.experience < cost) return false;
  progress.experience -= cost;
  progress.upgrades[id] = currentLevel + 1;
  return true;
}

export function awardExperience(progress: PermanentProgress, amount: number): number {
  const awarded = Math.max(0, Math.floor(amount));
  progress.experience += awarded;
  return awarded;
}

export function recordWave(
  progress: PermanentProgress,
  level: number,
  wave: number,
): { newRecord: boolean; unlockedLevel: number } {
  const safeLevel = Math.max(1, Math.floor(level));
  const safeWave = Math.max(0, Math.floor(wave));
  const previous = progress.bestWaveByLevel[safeLevel] ?? 0;
  progress.bestWaveByLevel[safeLevel] = Math.max(previous, safeWave);
  const newRecord = safeWave > previous;
  if (safeWave >= levelTargetWave(safeLevel)) {
    progress.highestUnlockedLevel = Math.max(progress.highestUnlockedLevel, safeLevel + 1);
  }
  return { newRecord, unlockedLevel: progress.highestUnlockedLevel };
}
