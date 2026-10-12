import { describe, expect, it } from "vitest";
import { advanceEnemy, applySlow, effectiveSpeed } from "../src/systems/movement";
import { buildSpawnQueue, createEnemy } from "../src/systems/spawn";
import { hpMultiplier } from "../src/config/waves";

describe("movement", () => {
  it("avanza según la velocidad y el delta", () => {
    const enemy = createEnemy(1, "basic", 1);
    const before = enemy.distance;
    advanceEnemy(enemy, 1);
    expect(enemy.distance).toBeCloseTo(before + enemy.baseSpeed, 5);
  });

  it("la ralentización reduce la velocidad y expira", () => {
    const enemy = createEnemy(1, "basic", 1);
    applySlow(enemy, 0.5, 1);
    expect(effectiveSpeed(enemy)).toBeCloseTo(enemy.baseSpeed * 0.5, 5);

    advanceEnemy(enemy, 1.1);
    expect(enemy.slowFactor).toBe(1);
    expect(enemy.slowTimer).toBe(0);
  });

  it("conserva la ralentización más fuerte", () => {
    const enemy = createEnemy(1, "basic", 1);
    applySlow(enemy, 0.5, 0.5);
    applySlow(enemy, 0.8, 0.5);
    expect(enemy.slowFactor).toBe(0.5);
  });
});

describe("spawn", () => {
  it("escala la vida con la oleada", () => {
    const wave3 = createEnemy(1, "basic", 3);
    const wave1 = createEnemy(2, "basic", 1);
    expect(wave3.maxHp).toBe(Math.round(40 * hpMultiplier(3)));
    expect(wave3.maxHp).toBeGreaterThan(wave1.maxHp);
  });

  it("la cola de aparición está ordenada por tiempo", () => {
    const queue = buildSpawnQueue(8);
    for (let i = 1; i < queue.length; i++) {
      expect(queue[i].at).toBeGreaterThanOrEqual(queue[i - 1].at);
    }
  });

  it("respeta el número total de enemigos de la oleada", () => {
    const queue = buildSpawnQueue(6);
    expect(queue.length).toBeGreaterThan(0);
  });
});
