import { describe, expect, it } from "vitest";
import { Game } from "../src/game";

describe("tower overload", () => {
  it("charges over time and can only activate on the selected tower", () => {
    const game = new Game();
    expect(game.placeTower(1, 1, "arrow")).toBe(true);
    const tower = game.towers[0];
    game.state.selectedTowerId = tower.id;
    expect(game.activateOverload()).toBe(false);
    game.update(44);
    expect(game.overloadChargeRatio).toBeLessThan(1);
    game.update(1);
    expect(game.overloadChargeRatio).toBe(1);
    expect(game.activateOverload()).toBe(true);
    expect(game.activeOverloadTowerId).toBe(tower.id);
    expect(game.overloadChargeRatio).toBe(0);
  });

  it("ends after six seconds and starts charging again", () => {
    const game = new Game();
    expect(game.placeTower(1, 1, "arrow")).toBe(true);
    game.state.selectedTowerId = game.towers[0].id;
    game.update(45);
    expect(game.activateOverload()).toBe(true);
    game.update(5.9);
    expect(game.activeOverloadTowerId).not.toBeNull();
    game.update(0.2);
    expect(game.activeOverloadTowerId).toBeNull();
    expect(game.overloadChargeRatio).toBe(0);
    game.update(1);
    expect(game.overloadChargeRatio).toBeGreaterThan(0);
  });

  it("stops the overload if its tower is sold", () => {
    const game = new Game();
    expect(game.placeTower(1, 1, "arrow")).toBe(true);
    const tower = game.towers[0];
    game.state.selectedTowerId = tower.id;
    game.update(45);
    expect(game.activateOverload()).toBe(true);
    expect(game.sellTower(tower.id)).toBe(true);
    expect(game.activeOverloadTowerId).toBeNull();
  });
});
