import { describe, expect, it } from "vitest";
import { MAX_TOWER_LEVEL, TOWERS } from "../src/config/towers";
import { buildCost, canAfford, sellValue, upgradeCost } from "../src/systems/economy";

describe("economy", () => {
  it("canAfford compara oro con coste", () => {
    expect(canAfford(100, 50)).toBe(true);
    expect(canAfford(50, 100)).toBe(false);
    expect(canAfford(50, 50)).toBe(true);
  });

  it("la venta devuelve la mitad de lo invertido", () => {
    expect(sellValue(100)).toBe(50);
    expect(sellValue(75)).toBe(37);
  });

  it("el coste de construcción viene del catálogo", () => {
    expect(buildCost("arrow")).toBe(TOWERS.arrow.buildCost);
  });

  it("el coste de mejora encadena por nivel y se detiene al máximo", () => {
    const first = upgradeCost("arrow", 1);
    const second = upgradeCost("arrow", 2);
    expect(first).toBe(TOWERS.arrow.upgradeCosts[0]);
    expect(second).toBe(TOWERS.arrow.upgradeCosts[1]);
    expect(upgradeCost("arrow", MAX_TOWER_LEVEL)).toBeNull();
  });
});
