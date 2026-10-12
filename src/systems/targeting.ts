import { cellCenter, positionAtDistance, type Vec } from "../config/map";
import type { TowerStats } from "../config/towers";
import type { Enemy, Tower } from "../state";

export function towerPosition(tower: Tower): Vec {
  return cellCenter(tower.col, tower.row);
}

export function enemyPosition(enemy: Enemy): Vec {
  return positionAtDistance(enemy.distance);
}

export function isTargetable(enemy: Enemy): boolean {
  return enemy.alive && !enemy.reachedBase && enemy.hp > 0;
}

export function findTarget(tower: Tower, stats: TowerStats, enemies: Enemy[]): Enemy | null {
  const origin = towerPosition(tower);
  const rangeSq = stats.range * stats.range;
  let best: Enemy | null = null;

  for (const enemy of enemies) {
    if (!isTargetable(enemy)) continue;
    const pos = enemyPosition(enemy);
    const dx = pos.x - origin.x;
    const dy = pos.y - origin.y;
    if (dx * dx + dy * dy > rangeSq) continue;

    if (tower.kind === "sniper") {
      if (
        best === null ||
        enemy.hp > best.hp ||
        (enemy.hp === best.hp && enemy.distance > best.distance)
      ) {
        best = enemy;
      }
    } else if (best === null || enemy.distance > best.distance) {
      best = enemy;
    }
  }
  return best;
}

export function findEnemiesInRadius(
  enemies: Enemy[],
  origin: Vec,
  radius: number,
  exclude: Set<number> = new Set(),
): Enemy[] {
  const radiusSq = radius * radius;
  const found: Enemy[] = [];
  for (const enemy of enemies) {
    if (!isTargetable(enemy) || exclude.has(enemy.id)) continue;
    const pos = enemyPosition(enemy);
    const dx = pos.x - origin.x;
    const dy = pos.y - origin.y;
    if (dx * dx + dy * dy <= radiusSq) found.push(enemy);
  }
  return found;
}
