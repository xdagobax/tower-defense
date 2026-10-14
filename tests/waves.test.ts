import { describe, expect, it } from "vitest";
import { buildWave, hpMultiplier, rewardMultiplier, speedMultiplier } from "../src/config/waves";

describe("waves", () => {
  it("la primera oleada solo tiene enemigos básicos", () => {
    const wave = buildWave(1);
    expect(wave.groups).toHaveLength(1);
    expect(wave.groups[0].kind).toBe("basic");
    expect(wave.totalEnemies).toBeGreaterThan(0);
  });

  it("las oleadas crecen en número de enemigos", () => {
    expect(buildWave(10).totalEnemies).toBeGreaterThan(buildWave(1).totalEnemies);
    expect(buildWave(5).totalEnemies).toBeGreaterThan(buildWave(2).totalEnemies);
  });

  it("añade enemigos rápidos a partir de la oleada 3", () => {
    expect(buildWave(2).groups.some((g) => g.kind === "fast")).toBe(false);
    expect(buildWave(3).groups.some((g) => g.kind === "fast")).toBe(true);
  });

  it("incluye un jefe cada 5 oleadas", () => {
    expect(buildWave(5).groups.some((g) => g.kind === "boss")).toBe(true);
    expect(buildWave(10).groups.some((g) => g.kind === "boss")).toBe(true);
    expect(buildWave(6).groups.some((g) => g.kind === "boss")).toBe(false);
  });

  it("aumenta notablemente la vida de todos los enemigos con cada oleada", () => {
    expect(hpMultiplier(1)).toBe(1);
    expect(hpMultiplier(2)).toBeCloseTo(1.15);
    expect(hpMultiplier(5)).toBeCloseTo(1.15 ** 4);
    expect(hpMultiplier(10)).toBeGreaterThan(3);
    expect(hpMultiplier(5)).toBeGreaterThan(hpMultiplier(1));
    expect(speedMultiplier(10)).toBeGreaterThan(speedMultiplier(1));
    expect(speedMultiplier(100)).toBeLessThanOrEqual(1.8);
    expect(rewardMultiplier(10)).toBeGreaterThan(rewardMultiplier(1));
  });
});
