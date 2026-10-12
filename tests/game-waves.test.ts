import { describe, expect, it } from "vitest";
import { Game } from "../src/game";

describe("early wave calls", () => {
  it("allows overlapping the next wave after the current wave has spawned", () => {
    const game = new Game();
    game.startWave();
    game.update(4);

    expect(game.canStartWave).toBe(true);
    expect(game.enemies.some((enemy) => enemy.wave === 1)).toBe(true);

    game.startWave();

    expect(game.state.wave).toBe(2);
    expect(game.state.phase).toBe("defending");
    expect(game.enemies.some((enemy) => enemy.wave === 1)).toBe(true);
    expect(game.earlyWaveBonus).toBe(0);
  });

  it("awards the remaining early-call bonus during the 12-second window", () => {
    const game = new Game();
    game.startWave();
    game.update(4);

    const goldBeforeCall = game.state.gold;
    expect(game.earlyWaveBonus).toBe(12);
    game.startWave();

    expect(game.state.gold).toBe(goldBeforeCall + 12);
    expect(game.state.wave).toBe(2);
  });

  it("allows a later call without bonus after the window expires", () => {
    const game = new Game();
    game.startWave();
    game.update(4);
    game.update(12);

    expect(game.canStartWave).toBe(true);
    expect(game.earlyWaveBonus).toBe(0);
    game.startWave();

    expect(game.state.wave).toBe(2);
    expect(game.state.gold).toBe(150);
  });
});
