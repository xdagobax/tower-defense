import { describe, expect, it } from "vitest";
import {
  awardExperience, canPurchaseUpgrade, createPermanentProgress, experienceForKill,
  experienceForWave, levelDifficultyMultiplier, levelTargetWave, purchaseUpgrade,
  recordWave, upgradeCost, upgradeMultiplier,
} from "../src/config/progression";

describe("permanent progression rules", () => {
  it("starts with level one and no permanent upgrades", () => {
    expect(createPermanentProgress()).toEqual({
      experience: 0, highestUnlockedLevel: 1, bestWaveByLevel: {}, upgrades: {},
    });
  });
  it("defines an unbounded sequence of level targets", () => {
    expect(levelTargetWave(1)).toBe(10);
    expect(levelTargetWave(2)).toBe(15);
    expect(levelTargetWave(100)).toBe(505);
  });
  it("increases difficulty without a fixed maximum level", () => {
    expect(levelDifficultyMultiplier(1)).toBe(1);
    expect(levelDifficultyMultiplier(2)).toBeGreaterThan(levelDifficultyMultiplier(1));
    expect(levelDifficultyMultiplier(100)).toBeGreaterThan(levelDifficultyMultiplier(10));
  });
  it("pays very little experience in the earliest waves", () => {
    expect(experienceForKill(1, 1)).toBe(0);
    expect(experienceForKill(1, 3)).toBe(0);
    expect(experienceForKill(1, 5)).toBe(1);
    expect(experienceForKill(2, 5)).toBeGreaterThan(experienceForKill(1, 5));
  });
  it("pays more for later waves and higher levels", () => {
    expect(experienceForKill(1, 10)).toBeGreaterThan(experienceForKill(1, 5));
    expect(experienceForWave(2, 10)).toBeGreaterThan(experienceForWave(1, 1));
  });
  it("raises the next purchase price each time the same upgrade is bought", () => {
    expect(upgradeCost("damage:arrow", 0)).toBe(100);
    expect(upgradeCost("damage:arrow", 1)).toBe(150);
    expect(upgradeCost("damage:arrow", 2)).toBe(225);
    expect(upgradeCost("damage:arrow", 3)).toBe(338);
  });
  it("tracks purchase cost independently per upgrade and weapon", () => {
    const progress = createPermanentProgress();
    progress.experience = 500;
    expect(purchaseUpgrade(progress, "damage:arrow")).toBe(true);
    expect(purchaseUpgrade(progress, "damage:arrow")).toBe(true);
    expect(progress.upgrades["damage:arrow"]).toBe(2);
    expect(progress.upgrades["damage:cannon"] ?? 0).toBe(0);
    expect(upgradeCost("damage:cannon", progress.upgrades["damage:cannon"] ?? 0)).toBe(100);
  });
  it("does not allow a purchase without enough experience", () => {
    const progress = createPermanentProgress();
    progress.experience = 99;
    expect(canPurchaseUpgrade(progress, "startingGold")).toBe(false);
    expect(purchaseUpgrade(progress, "startingGold")).toBe(false);
    expect(progress.experience).toBe(99);
    expect(progress.upgrades.startingGold).toBeUndefined();
  });
  it("spends experience and records purchased upgrades", () => {
    const progress = createPermanentProgress();
    awardExperience(progress, 250);
    expect(purchaseUpgrade(progress, "fireRate:sniper")).toBe(true);
    expect(progress.experience).toBe(150);
    expect(progress.upgrades["fireRate:sniper"]).toBe(1);
  });
  it("keeps the first ten upgrades at 3% each and adds 5% per upgrade after that", () => {
    expect(upgradeMultiplier(0)).toBe(1);
    expect(upgradeMultiplier(1)).toBe(1.03);
    expect(upgradeMultiplier(10)).toBe(1.3);
    expect(upgradeMultiplier(11)).toBe(1.35);
    expect(upgradeMultiplier(12)).toBe(1.4);
    expect(upgradeMultiplier(100)).toBe(5.8);
  });
  it("allows permanent upgrades beyond level ten while their cost keeps increasing", () => {
    const progress = createPermanentProgress();
    progress.experience = 1_000_000_000;
    progress.upgrades["damage:arrow"] = 10;
    expect(upgradeCost("damage:arrow", 10)).toBeGreaterThan(upgradeCost("damage:arrow", 9));
    expect(purchaseUpgrade(progress, "damage:arrow")).toBe(true);
    expect(progress.upgrades["damage:arrow"]).toBe(11);
    expect(upgradeMultiplier(progress.upgrades["damage:arrow"] ?? 0)).toBe(1.35);
  });
  it("unlocks the next level only after reaching the current target", () => {
    const progress = createPermanentProgress();
    recordWave(progress, 1, 9);
    expect(progress.highestUnlockedLevel).toBe(1);
    recordWave(progress, 1, 10);
    expect(progress.highestUnlockedLevel).toBe(2);
    expect(recordWave(progress, 1, 8).newRecord).toBe(false);
  });
  it("keeps each level record separate and never relocks unlocked levels", () => {
    const progress = createPermanentProgress();
    recordWave(progress, 1, 10);
    recordWave(progress, 2, 15);
    recordWave(progress, 1, 4);
    expect(progress.bestWaveByLevel).toEqual({ 1: 10, 2: 15 });
    expect(progress.highestUnlockedLevel).toBe(3);
  });
  it("never awards negative experience", () => {
    const progress = createPermanentProgress();
    expect(awardExperience(progress, -50)).toBe(0);
    expect(progress.experience).toBe(0);
  });
});
