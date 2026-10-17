import { ENEMIES } from "../config/enemies";
import { SEGMENTS, TILE, cellCenter } from "../config/map";
import { TOWERS, towerStats } from "../config/towers";
import type { Game } from "../game";
import type { Enemy, Tower } from "../state";
import { enemyPosition, towerPosition } from "../systems/targeting";
import { traceShape } from "./shapes";

const INK = "#000";
const PAPER = "#fff";
const GRID = "#eaeaea";
const PATH = "#d8d8d8";

export interface HoverCell {
  col: number;
  row: number;
}

export class Renderer {
  hover: HoverCell | null = null;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly game: Game,
  ) {}

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, this.game.fieldWidth, this.game.fieldHeight);

    this.drawGrid();
    this.drawPath();
    this.drawEndpoints();
    this.drawTowers();
    this.drawPlacementPreview();
    this.drawEnemies();
    this.drawProjectiles();
    this.drawEffects();
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= this.game.cols; c++) {
      const x = c * TILE + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.game.fieldHeight);
    }
    for (let r = 0; r <= this.game.rows; r++) {
      const y = r * TILE + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(this.game.fieldWidth, y);
    }
    ctx.stroke();
  }

  private drawPath(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = PATH;
    ctx.lineWidth = TILE * 0.72;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(SEGMENTS[0].a.x, SEGMENTS[0].a.y);
    for (const seg of SEGMENTS) ctx.lineTo(seg.b.x, seg.b.y);
    ctx.stroke();
  }

  private drawEndpoints(): void {
    const ctx = this.ctx;
    const { spawn, base } = this.game;

    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(base.x - 11, base.y - 11, 22, 22);
    ctx.beginPath();
    ctx.moveTo(base.x - 11, base.y - 11);
    ctx.lineTo(base.x + 11, base.y + 11);
    ctx.moveTo(base.x + 11, base.y - 11);
    ctx.lineTo(base.x - 11, base.y + 11);
    ctx.stroke();
  }

  private drawTowers(): void {
    for (const tower of this.game.towers) {
      const selected = this.game.state.selectedTowerId === tower.id;
      if (selected) this.drawRange(tower);
      this.drawTower(tower, selected);
      if (this.game.activeOverloadTowerId === tower.id) this.drawOverloadEffect(tower);
    }
  }

  private drawRange(tower: Tower): void {
    const ctx = this.ctx;
    const stats = towerStats(tower.kind, tower.level);
    const center = towerPosition(tower);
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center.x, center.y, stats.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawOverloadEffect(tower: Tower): void {
    const ctx = this.ctx;
    const center = towerPosition(tower);
    const pulse = 1 + Math.sin(this.game.overloadTimeRemaining * 8) * 0.08;
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, TILE * 0.62 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center.x, center.y, TILE * 0.78 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawTower(tower: Tower, selected: boolean): void {
    const ctx = this.ctx;
    const center = towerPosition(tower);
    const def = TOWERS[tower.kind];

    ctx.fillStyle = PAPER;
    ctx.fillRect(center.x - TILE / 2 + 3, center.y - TILE / 2 + 3, TILE - 6, TILE - 6);

    ctx.strokeStyle = INK;
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.strokeRect(center.x - TILE / 2 + 3, center.y - TILE / 2 + 3, TILE - 6, TILE - 6);

    ctx.save();
    if (tower.kind === "arrow" || tower.kind === "sniper") {
      ctx.translate(center.x, center.y);
      ctx.rotate(tower.angle);
      ctx.translate(-center.x, -center.y);
    }
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = 2;
    traceShape(ctx, def.shape, center.x, center.y, 8);
    ctx.stroke();
    ctx.restore();

    const pips = tower.level;
    ctx.fillStyle = INK;
    for (let i = 0; i < pips; i++) {
      ctx.fillRect(center.x - 7 + i * 6, center.y + TILE / 2 - 8, 4, 4);
    }
  }

  private drawPlacementPreview(): void {
    if (!this.game.state.selectedKind || !this.hover) return;
    const ctx = this.ctx;
    const { col, row } = this.hover;
    const center = cellCenter(col, row);
    const ok = this.game.canPlace(col, row, this.game.state.selectedKind);
    const stats = towerStats(this.game.state.selectedKind, 1);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = INK;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(center.x, center.y, stats.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = ok ? INK : PAPER;
    ctx.fillRect(col * TILE + 3, row * TILE + 3, TILE - 6, TILE - 6);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(col * TILE + 3, row * TILE + 3, TILE - 6, TILE - 6);

    if (ok) {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      traceShape(ctx, TOWERS[this.game.state.selectedKind].shape, center.x, center.y, 8);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  private drawEnemies(): void {
    const ctx = this.ctx;
    for (const enemy of this.game.enemies) {
      if (!enemy.alive || enemy.reachedBase) continue;
      const pos = enemyPosition(enemy);
      const def = ENEMIES[enemy.kind];

      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      traceShape(ctx, def.shape, pos.x, pos.y, enemy.size * 0.7);
      ctx.fill();

      this.drawHealthBar(enemy, pos.x, pos.y - enemy.size - 4);
    }
  }

  private drawHealthBar(enemy: Enemy, x: number, y: number): void {
    const ctx = this.ctx;
    const width = Math.max(16, enemy.size * 1.8);
    const ratio = enemy.hp / enemy.maxHp;
    const left = x - width / 2;
    ctx.fillStyle = PAPER;
    ctx.fillRect(left, y, width, 4);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.strokeRect(left, y, width, 4);
    ctx.fillStyle = INK;
    ctx.fillRect(left, y, width * ratio, 4);
  }

  private drawProjectiles(): void {
    const ctx = this.ctx;
    ctx.fillStyle = INK;
    for (const projectile of this.game.projectiles) {
      ctx.beginPath();
      if (projectile.kind === "cannon") {
        ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
      } else if (projectile.kind === "frost") {
        ctx.arc(projectile.x, projectile.y, 3.5, 0, Math.PI * 2);
      } else {
        ctx.arc(projectile.x, projectile.y, 2.5, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  private drawEffects(): void {
    const ctx = this.ctx;

    for (const beam of this.game.beams) {
      const alpha = Math.max(0, beam.life / beam.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
      ctx.restore();
    }

    for (const flash of this.game.flashes) {
      const alpha = Math.max(0, flash.life / flash.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
