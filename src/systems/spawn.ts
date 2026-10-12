import { ENEMIES, type EnemyKind } from "../config/enemies";
import { buildWave, hpMultiplier, rewardMultiplier, speedMultiplier } from "../config/waves";
import type { Enemy, QueuedSpawn } from "../state";

export function buildSpawnQueue(wave: number): QueuedSpawn[] {
  const def = buildWave(wave);
  const queue: QueuedSpawn[] = [];
  for (const group of def.groups) {
    for (let i = 0; i < group.count; i++) {
      queue.push({ kind: group.kind, at: group.delay + i * group.interval });
    }
  }
  queue.sort((a, b) => a.at - b.at);
  return queue;
}

export function createEnemy(id: number, kind: EnemyKind, wave: number): Enemy {
  const def = ENEMIES[kind];
  const hp = Math.round(def.hp * hpMultiplier(wave));
  return {
    id,
    kind,
    hp,
    maxHp: hp,
    baseSpeed: def.speed * speedMultiplier(wave),
    reward: Math.round(def.reward * rewardMultiplier(wave)),
    armor: def.armor,
    size: def.size,
    distance: 0,
    slowTimer: 0,
    slowFactor: 1,
    alive: true,
    reachedBase: false,
  };
}
