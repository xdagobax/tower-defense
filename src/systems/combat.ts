import { positionAtDistance, type Vec } from "../config/map";
import type { Enemy } from "../state";
import { applySlow } from "./movement";
import { findEnemiesInRadius } from "./targeting";

export function computeDamage(rawDamage: number, armor: number): number {
  return Math.max(1, rawDamage - armor);
}

export function damageEnemy(enemy: Enemy, rawDamage: number): void {
  if (!enemy.alive) return;
  enemy.hp -= computeDamage(rawDamage, enemy.armor);
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.alive = false;
  }
}

export interface HitOptions {
  splash?: number;
  slowFactor?: number;
  slowDuration?: number;
}

export interface HitResult {
  killed: Enemy[];
  affected: Enemy[];
}

export function applyHit(
  enemies: Enemy[],
  target: Enemy,
  damage: number,
  options: HitOptions = {},
): HitResult {
  const affected: Enemy[] = [];
  const killed: Enemy[] = [];

  const register = (enemy: Enemy): void => {
    const wasAlive = enemy.alive;
    damageEnemy(enemy, damage);
    if (options.slowFactor !== undefined && options.slowDuration !== undefined) {
      applySlow(enemy, options.slowFactor, options.slowDuration);
    }
    affected.push(enemy);
    if (wasAlive && !enemy.alive) killed.push(enemy);
  };

  register(target);

  if (options.splash && options.splash > 0) {
    const center = positionAtDistance(target.distance);
    const exclude = new Set<number>([target.id]);
    for (const enemy of findEnemiesInRadius(enemies, center, options.splash, exclude)) {
      register(enemy);
    }
  }

  return { killed, affected };
}


export function applyFrostAura(
  enemies: Enemy[],
  origin: Vec,
  range: number,
  slowFactor: number,
  slowDuration: number,
): Enemy[] {
  const affected = findEnemiesInRadius(enemies, origin, range);
  for (const enemy of affected) {
    applySlow(enemy, slowFactor, slowDuration);
  }
  return affected;
}
