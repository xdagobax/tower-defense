import { describe, expect, it } from "vitest";
import { positionAtDistance } from "../src/config/map";
import { createEnemy } from "../src/systems/spawn";
import { applyFrostAura, applyHit, computeDamage, damageEnemy } from "../src/systems/combat";
import type { Enemy } from "../src/state";

function makeEnemy(id: number, distance: number): Enemy {
  const enemy = createEnemy(id, "basic", 1);
  enemy.distance = distance;
  return enemy;
}

describe("combat", () => {
  it("la armadura reduce el daño con un mínimo de 1", () => {
    expect(computeDamage(10, 3)).toBe(7);
    expect(computeDamage(2, 5)).toBe(1);
    expect(computeDamage(10, 0)).toBe(10);
  });

  it("damageEnemy mata al enemigo cuando la vida llega a cero", () => {
    const enemy = makeEnemy(1, 0);
    damageEnemy(enemy, 1000);
    expect(enemy.alive).toBe(false);
    expect(enemy.hp).toBe(0);
  });

  it("applyHit con área golpea a los enemigos cercanos pero no a los lejanos", () => {
    const target = makeEnemy(1, 100);
    const near = makeEnemy(2, 130);
    const far = makeEnemy(3, 400);
    const result = applyHit([target, near, far], target, 5, { splash: 60 });
    const ids = result.affected.map((e) => e.id).sort();
    expect(ids).toEqual([1, 2]);
    expect(far.hp).toBe(far.maxHp);
  });

  it("el aura de escarcha ralentiza a los enemigos en rango sin causar daño", () => {
    const target = makeEnemy(1, 100);
    const outside = makeEnemy(2, 500);
    const origin = positionAtDistance(target.distance);
    const hpBefore = target.hp;

    const affected = applyFrostAura([target, outside], origin, 30, 0.5, 0.1);

    expect(affected.map((enemy) => enemy.id)).toEqual([1]);
    expect(target.hp).toBe(hpBefore);
    expect(target.slowFactor).toBe(0.5);
    expect(target.slowTimer).toBe(0.1);
    expect(outside.slowTimer).toBe(0);
  });

  it("applyHit registra las bajas", () => {
    const target = makeEnemy(1, 100);
    const result = applyHit([target], target, 1000);
    expect(result.killed).toHaveLength(1);
  });
});
