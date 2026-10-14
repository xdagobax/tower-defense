import { describe, expect, it } from "vitest";
import { Game } from "../src/game";

describe("survival progression integration", () => {
  it("allows waves beyond the old global limit", () => {
    const game = new Game({ wave: 21 });
    expect(game.canStartWave).toBe(true);
    game.startWave();
    expect(game.state.wave).toBe(21);
  });

  it("preserves permanent progress when restarting the selected level", () => {
    const game = new Game();
    game.progress.experience = 250;
    game.progress.highestUnlockedLevel = 2;
    game.progress.upgrades.startingGold = 1;
    expect(game.selectLevel(2)).toBe(true);
    game.progress.experience -= 50;
    game.restart();
    expect(game.level).toBe(2);
    expect(game.progress.experience).toBe(200);
    expect(game.progress.highestUnlockedLevel).toBe(2);
    expect(game.progress.upgrades.startingGold).toBe(1);
    expect(game.state.gold).toBe(155);
  });

  it("does not allow selecting a locked level", () => {
    const game = new Game();
    expect(game.selectLevel(2)).toBe(false);
    expect(game.level).toBe(1);
  });

  it("resets permanent progression only when starting a new game", () => {
    const game = new Game();
    game.progress.experience = 250;
    game.progress.highestUnlockedLevel = 3;
    game.progress.upgrades.killGold = 2;
    game.newGame();
    expect(game.level).toBe(1);
    expect(game.progress.experience).toBe(0);
    expect(game.progress.highestUnlockedLevel).toBe(1);
    expect(game.progress.upgrades).toEqual({});
  });

  it("applies damage upgrades only to the purchased tower type", () => {
    const game = new Game();
    game.progress.upgrades["damage:arrow"] = 1;
    const getStats = (kind: "arrow" | "cannon") =>
      (game as unknown as { effectiveTowerStats(kind: "arrow" | "cannon", level: number): { damage: number } }).effectiveTowerStats(kind, 1);
    expect(getStats("arrow").damage).toBeCloseTo(8.24);
    expect(getStats("cannon").damage).toBe(16);
  });
});
