import { describe, expect, it } from "vitest";
import { Game } from "../src/game";
import { createEnemy } from "../src/systems/spawn";

function prepareCombat(game: Game): void {
  game.state.phase = "defending";
  const enemy = createEnemy(999, "basic", 1);
  enemy.baseSpeed = 0;
  enemy.hp = 1_000_000;
  enemy.maxHp = enemy.hp;
  game.enemies.push(enemy);
}

describe("tower overload", () => {
  it("charges over time and can only activate on the selected tower", () => {
    const game = new Game();
    expect(game.placeTower(1, 1, "arrow")).toBe(true);
    prepareCombat(game);
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
    prepareCombat(game);
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

  it("only recharges during combat and allows buying charge for increasing gold costs", () => {
    const game = new Game();
    expect(game.placeTower(1, 1, "arrow")).toBe(true);
    game.update(45);
    expect(game.overloadChargeRatio).toBe(0);

    prepareCombat(game);
    game.state.gold = 500;
    expect(game.purchaseOverloadCharge()).toBe(true);
    expect(game.overloadChargeRatio).toBe(0.25);
    expect(game.state.gold).toBe(450);
    expect(game.overloadChargePurchaseCost).toBe(88);
    expect(game.purchaseOverloadCharge()).toBe(true);
    expect(game.overloadChargeRatio).toBe(0.5);
    expect(game.state.gold).toBe(362);
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
