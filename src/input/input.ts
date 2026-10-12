import { TOWER_ORDER } from "../config/towers";
import type { Game } from "../game";
import type { Renderer } from "../render/renderer";

export function attachInput(
  canvas: HTMLCanvasElement,
  game: Game,
  renderer: Renderer,
  onChange: () => void,
): void {
  const toCell = (clientX: number, clientY: number): { col: number; row: number } => {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * game.fieldWidth;
    const y = ((clientY - rect.top) / rect.height) * game.fieldHeight;
    return { col: Math.floor(x / game.tile), row: Math.floor(y / game.tile) };
  };

  canvas.addEventListener("mousemove", (ev) => {
    const { col, row } = toCell(ev.clientX, ev.clientY);
    renderer.hover = { col, row };
  });

  canvas.addEventListener("mouseleave", () => {
    renderer.hover = null;
  });

  canvas.addEventListener("click", (ev) => {
    const { col, row } = toCell(ev.clientX, ev.clientY);
    const existing = game.towerAt(col, row);

    if (existing) {
      game.state.selectedTowerId = existing.id;
      game.state.selectedKind = null;
    } else if (game.state.selectedKind) {
      game.placeTower(col, row, game.state.selectedKind);
    } else {
      game.state.selectedTowerId = null;
    }
    onChange();
  });

  canvas.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    game.state.selectedKind = null;
    game.state.selectedTowerId = null;
    onChange();
  });

  window.addEventListener("keydown", (ev) => {
    const index = Number.parseInt(ev.key, 10);
    if (index >= 1 && index <= TOWER_ORDER.length) {
      const kind = TOWER_ORDER[index - 1];
      if (game.isUnlocked(kind)) {
        game.state.selectedKind = kind;
        game.state.selectedTowerId = null;
      }
      onChange();
      return;
    }

    switch (ev.key.toLowerCase()) {
      case " ":
        ev.preventDefault();
        game.startWave();
        onChange();
        break;
      case "p":
        game.state.paused = !game.state.paused;
        onChange();
        break;
      case "f":
        game.state.speed = game.state.speed >= 3 ? 1 : game.state.speed + 1;
        onChange();
        break;
      default:
        break;
    }
  });
}
