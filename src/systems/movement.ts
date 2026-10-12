import type { Enemy } from "../state";

export function effectiveSpeed(enemy: Enemy): number {
  return enemy.baseSpeed * enemy.slowFactor;
}

export function applySlow(enemy: Enemy, factor: number, duration: number): void {
  if (enemy.slowTimer <= 0 || factor < enemy.slowFactor) {
    enemy.slowFactor = factor;
  }
  enemy.slowTimer = Math.max(enemy.slowTimer, duration);
}

export function tickSlow(enemy: Enemy, dt: number): void {
  if (enemy.slowTimer > 0) {
    enemy.slowTimer -= dt;
    if (enemy.slowTimer <= 0) {
      enemy.slowTimer = 0;
      enemy.slowFactor = 1;
    }
  }
}

export function advanceEnemy(enemy: Enemy, dt: number): void {
  tickSlow(enemy, dt);
  enemy.distance += effectiveSpeed(enemy) * dt;
}
