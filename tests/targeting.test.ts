import { describe, expect, it } from "vitest";
import { cellCenter } from "../src/config/map";
import { towerStats } from "../src/config/towers";
import type { Enemy, Tower } from "../src/state";
import { createEnemy } from "../src/systems/spawn";
import { findEnemiesInRadius, findTarget, towerPosition } from "../src/systems/targeting";

function makeEnemy(id: number, distance: number): Enemy {
  const enemy = createEnemy(id, "basic", 1);
  enemy.distance = distance;
  return enemy;
}

const tower: Tower = {
  id: 1,
  kind: "arrow",
  col: 0,
  row: 0,
  level: 1,
  cooldown: 0,
  invested: 50,
  angle: 0,
};

describe("targeting", () => {
  it("la posición de la torreta corresponde al centro de su celda", () => {
    expect(towerPosition(tower)).toEqual(cellCenter(0, 0));
  });

  it("elige al enemigo en rango más avanzado del camino", () => {
    const stats = { ...towerStats("arrow", 1), range: 500 };
    const behind = makeEnemy(1, 100);
    const ahead = makeEnemy(2, 200);
    const target = findTarget(tower, stats, [behind, ahead]);
    expect(target?.id).toBe(2);
  });

  it("devuelve null si ningún enemigo está en rango", () => {
    const stats = { ...towerStats("arrow", 1), range: 30 };
    const target = findTarget(tower, stats, [makeEnemy(1, 100)]);
    expect(target).toBeNull();
  });

  it("ignora enemigos muertos o que llegaron a la base", () => {
    const stats = { ...towerStats("arrow", 1), range: 500 };
    const dead = makeEnemy(1, 200);
    dead.alive = false;
    const leaked = makeEnemy(2, 300);
    leaked.reachedBase = true;
    expect(findTarget(tower, stats, [dead, leaked])).toBeNull();
  });

  it("encuentra enemigos dentro de un radio, excluyendo ids", () => {
    const enemies = [makeEnemy(1, 100), makeEnemy(2, 130), makeEnemy(3, 400)];
    const center = { x: 120, y: 100 };
    const found = findEnemiesInRadius(enemies, center, 60, new Set([1]));
    expect(found.map((e) => e.id)).toEqual([2]);
  });
});
