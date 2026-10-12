import { createLoop } from "./core/loop";
import { Game } from "./game";
import { attachInput } from "./input/input";
import { clearPersisted, loadIntoGame, persistGame } from "./persistence/save";
import { Hud } from "./render/hud";
import { Renderer } from "./render/renderer";

const canvas = document.getElementById("field") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("No se pudo obtener el contexto 2D");

const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = 800 * dpr;
canvas.height = 480 * dpr;
ctx.scale(dpr, dpr);

const game = new Game();
loadIntoGame(game);
const renderer = new Renderer(ctx, game);

const hud = new Hud(game, {
  onSelectKind(kind) {
    game.state.selectedKind = kind;
    game.state.selectedTowerId = null;
  },
  onStartWave() {
    game.startWave();
    persistGame(game);
  },
  onTogglePause() {
    game.state.paused = !game.state.paused;
  },
  onToggleSpeed() {
    game.state.speed = game.state.speed >= 3 ? 1 : game.state.speed + 1;
  },
  onRestart() {
    game.restart();
    clearPersisted();
  },
  onUpgrade() {
    if (game.state.selectedTowerId !== null) game.upgradeTower(game.state.selectedTowerId);
    persistGame(game);
  },
  onSell() {
    if (game.state.selectedTowerId !== null) game.sellTower(game.state.selectedTowerId);
    persistGame(game);
  },
});

attachInput(canvas, game, renderer, () => persistGame(game));

if (import.meta.env.DEV) {
  (window as unknown as { __game: Game }).__game = game;
}

let lastPhase = game.state.phase;
const loop = createLoop({
  update(dt) {
    game.update(dt);
    if (game.state.phase !== lastPhase) {
      lastPhase = game.state.phase;
      persistGame(game);
    }
  },
  render() {
    renderer.render();
    hud.update();
  },
});

loop.start();
