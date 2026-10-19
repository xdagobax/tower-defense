import { ENEMIES, type EnemyKind } from "./config/enemies";
import {
  BASE,
  COLS,
  FIELD_H,
  FIELD_W,
  ROWS,
  SPAWN,
  TILE,
  TOTAL_PATH_LENGTH,
  cellCenter,
  setMapLevel,
  isBuildable,
  type Vec,
} from "./config/map";
import { MAX_TOWER_LEVEL, TOWERS, towerStats, type TowerKind } from "./config/towers";
import { awardExperience, canPurchaseUpgrade, createPermanentProgress, experienceForKill, experienceForWave, levelDifficultyMultiplier, overloadUpgradeStats, purchaseUpgrade, recordWave, upgradeMultiplier, type PermanentProgress, type UpgradeId } from "./config/progression";
import {
  EARLY_WAVE_GOLD_PER_SECOND,
  EARLY_WAVE_WINDOW_SECONDS,
  waveRewardBonus,
} from "./config/waves";
import type { Enemy, GameState, Projectile, QueuedSpawn, Tower } from "./state";
import { applyFrostAura, applyHit } from "./systems/combat";
import { buildCost, canAfford, sellValue, upgradeCost } from "./systems/economy";
import { advanceEnemy } from "./systems/movement";
import { buildSpawnQueue, createEnemy } from "./systems/spawn";
import { enemyPosition, findTarget, isTargetable, towerPosition } from "./systems/targeting";

const STARTING_GOLD = 150;
const STARTING_LIVES = 20;
const TESLA_CHAIN_RANGE = 90;

export interface Beam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  maxLife: number;
}

export interface Flash {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export class Game {
  readonly fieldWidth = FIELD_W;
  readonly fieldHeight = FIELD_H;
  readonly cols = COLS;
  readonly rows = ROWS;
  readonly tile = TILE;
  readonly spawn: Vec = SPAWN;
  readonly base: Vec = BASE;
  get totalPathLength(): number { return TOTAL_PATH_LENGTH; }

  state: GameState;
  level = 1;
  progress: PermanentProgress = createPermanentProgress();
  progressRevision = 0;
  enemies: Enemy[] = [];
  towers: Tower[] = [];
  projectiles: Projectile[] = [];
  beams: Beam[] = [];
  flashes: Flash[] = [];

  messages: string[] = [];

  private spawnQueue: QueuedSpawn[] = [];
  private spawnIndex = 0;
  private spawnElapsed = 0;
  private spawnQueueWave = 1;
  private spawnQueueFinished = false;
  private earlyWindowRemaining = 0;
  private overloadCharge = 0;
  private overloadedTowerId: number | null = null;
  private overloadRemaining = 0;
  private get overloadDuration(): number { return overloadUpgradeStats(this.progress.upgrades.overload ?? 0).duration; }
  private readonly overloadChargeSeconds = 45;
  private overloadChargePurchases = 0;
  private readonly wavesAwaitingClear = new Set<number>();
  private nextEnemyId = 1;
  private nextTowerId = 1;
  private nextProjectileId = 1;

  constructor(state?: Partial<GameState>) {
    this.state = {
      phase: "build",
      gold: this.startingGold(),
      lives: STARTING_LIVES,
      maxLives: STARTING_LIVES,
      wave: 1,
      speed: 1,
      paused: false,
      selectedKind: "arrow",
      selectedTowerId: null,
      ...state,
    };
  }

  isUnlocked(kind: TowerKind): boolean {
    return this.state.wave >= TOWERS[kind].unlockWave;
  }

  towerAt(col: number, row: number): Tower | undefined {
    return this.towers.find((t) => t.col === col && t.row === row);
  }

  canPlace(col: number, row: number, kind: TowerKind): boolean {
    return (
      isBuildable(col, row) &&
      !this.towerAt(col, row) &&
      this.isUnlocked(kind) &&
      canAfford(this.state.gold, buildCost(kind))
    );
  }

  placeTower(col: number, row: number, kind: TowerKind): boolean {
    if (!this.canPlace(col, row, kind)) return false;
    const cost = buildCost(kind);
    this.state.gold -= cost;
    this.towers.push({
      id: this.nextTowerId++,
      kind,
      col,
      row,
      level: 1,
      cooldown: 0,
      invested: cost,
      angle: 0,
    });
    return true;
  }

  upgradeTower(id: number): boolean {
    const tower = this.towers.find((t) => t.id === id);
    if (!tower) return false;
    const cost = upgradeCost(tower.kind, tower.level);
    if (cost === null || !canAfford(this.state.gold, cost)) return false;
    this.state.gold -= cost;
    tower.level = Math.min(MAX_TOWER_LEVEL, tower.level + 1);
    tower.invested += cost;
    return true;
  }

  sellTower(id: number): boolean {
    const idx = this.towers.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    const tower = this.towers[idx];
    this.state.gold += sellValue(tower.invested);
    this.towers.splice(idx, 1);
    if (this.overloadedTowerId === id) {
      this.overloadedTowerId = null;
      this.overloadRemaining = 0;
    }
    if (this.state.selectedTowerId === id) this.state.selectedTowerId = null;
    return true;
  }

  startWave(): void {
    if (!this.canStartWave) return;

    const bonus = this.earlyWaveBonus;
    this.state.gold += bonus;
    this.earlyWindowRemaining = 0;

    if (this.state.phase === "defending") {
      this.state.wave += 1;
    } else {
      this.state.phase = "defending";
    }

    this.spawnQueueWave = this.state.wave;
    this.spawnQueue = buildSpawnQueue(this.spawnQueueWave);
    this.spawnIndex = 0;
    this.spawnElapsed = 0;
    this.spawnQueueFinished = false;
    this.state.selectedTowerId = null;
    this.announce(
      bonus > 0
        ? `Oleada ${this.state.wave}: +${bonus} oro por adelantarla`
        : `Oleada ${this.state.wave}`,
    );
  }

  get canStartWave(): boolean {
    if (this.state.phase === "build") return true;
    return this.state.phase === "defending" && this.spawnQueueFinished;
  }

  get earlyWaveBonus(): number {
    return Math.ceil(this.earlyWindowRemaining * EARLY_WAVE_GOLD_PER_SECOND);
  }

  get earlyWaveWindowRemaining(): number {
    return this.earlyWindowRemaining;
  }

  restart(): void {
    const best = this.bestWave;
    const level = this.level;
    setMapLevel(level);
    this.state = {
      phase: "build",
      gold: this.startingGold(),
      lives: STARTING_LIVES,
      maxLives: STARTING_LIVES,
      wave: 1,
      speed: 1,
      paused: false,
      selectedKind: "arrow",
      selectedTowerId: null,
    };
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.beams = [];
    this.flashes = [];
    this.messages = [];
    this.spawnQueue = [];
    this.spawnIndex = 0;
    this.spawnElapsed = 0;
    this.spawnQueueWave = 1;
    this.spawnQueueFinished = false;
    this.earlyWindowRemaining = 0;
    this.overloadCharge = 0;
    this.overloadedTowerId = null;
    this.overloadRemaining = 0;
    this.overloadChargePurchases = 0;
    this.wavesAwaitingClear.clear();
    this.nextEnemyId = 1;
    this.nextTowerId = 1;
    this.nextProjectileId = 1;
    this.bestWave = best;
    this.level = level;
  }

  newGame(): void {
    this.progress = createPermanentProgress();
    this.progressRevision++;
    this.level = 1;
    this.bestWave = 0;
    this.restart();
  }

  selectLevel(level: number): boolean {
    const target = Math.floor(level);
    if (target < 1 || target > this.progress.highestUnlockedLevel) return false;
    this.level = target;
    this.restart();
    return true;
  }

  get overloadChargeRatio(): number {
    return this.overloadCharge;
  }

  get activeOverloadTowerId(): number | null {
    return this.overloadedTowerId;
  }

  get overloadTimeRemaining(): number {
    return this.overloadRemaining;
  }

  get overloadChargePurchaseAmount(): number {
    return 0.25;
  }

  get overloadChargePurchaseCost(): number {
    return Math.ceil(50 * Math.pow(1.75, this.overloadChargePurchases));
  }

  purchaseOverloadCharge(): boolean {
    const cost = this.overloadChargePurchaseCost;
    if (
      this.state.paused ||
      this.state.phase !== "defending" ||
      this.overloadCharge >= 1 ||
      this.overloadedTowerId !== null ||
      !this.enemies.some((enemy) => enemy.alive && !enemy.reachedBase) ||
      this.state.gold < cost
    ) return false;
    this.state.gold -= cost;
    this.overloadCharge = Math.min(1, this.overloadCharge + this.overloadChargePurchaseAmount);
    this.overloadChargePurchases++;
    this.announce(`Compraste carga de sobrecarga por ${cost} oro`);
    return true;
  }

  activateOverload(): boolean {
    const towerId = this.state.selectedTowerId;
    if (towerId === null || this.overloadCharge < 1 || this.overloadedTowerId !== null) return false;
    if (this.state.phase === "gameover" || this.state.phase === "victory") return false;
    const tower = this.towers.find((item) => item.id === towerId);
    if (!tower) return false;
    this.overloadCharge = 0;
    this.overloadedTowerId = towerId;
    this.overloadRemaining = this.overloadDuration;
    this.announce(`¡Sobrecarga activada! ${TOWERS[tower.kind].name} potenciada durante ${this.overloadDuration} segundos`);
    return true;
  }

  private startingGold(): number {
    return STARTING_GOLD + Math.round(STARTING_GOLD * (upgradeMultiplier(this.progress.upgrades.startingGold ?? 0) - 1));
  }

  private effectiveTowerStats(kind: TowerKind, level: number) {
    const base = towerStats(kind, level);
    return {
      ...base,
      damage: base.damage * upgradeMultiplier(this.progress.upgrades[`damage:${kind}`] ?? 0),
      fireRate: base.fireRate * upgradeMultiplier(this.progress.upgrades[`fireRate:${kind}`] ?? 0),
    };
  }

  purchasePermanentUpgrade(id: UpgradeId): boolean {
    if (!canPurchaseUpgrade(this.progress, id)) return false;
    const bought = purchaseUpgrade(this.progress, id);
    if (bought) this.progressRevision++;
    return bought;
  }

  private recordCurrentWave(wave = this.state.wave): void {
    const result = recordWave(this.progress, this.level, wave);
    this.progressRevision++;
    if (wave >= 10 + (this.level - 1) * 5) this.progressRevision += awardExperience(this.progress, experienceForWave(this.level, wave));
    this.bestWave = Math.max(this.bestWave, wave);
    if (result.unlockedLevel > this.level) this.announce(`¡Nivel ${this.level} superado! Nivel ${this.level + 1} desbloqueado`);
  }

  bestWave = 0;

  update(dt: number): void {
    if (this.state.phase === "gameover" || this.state.phase === "victory") return;
    if (this.state.paused) return;

    const sdt = dt * this.state.speed;
    this.earlyWindowRemaining = Math.max(0, this.earlyWindowRemaining - sdt);
    if (this.overloadedTowerId !== null) {
      this.overloadRemaining = Math.max(0, this.overloadRemaining - sdt);
      if (this.overloadRemaining === 0 || !this.towers.some((tower) => tower.id === this.overloadedTowerId)) {
        this.overloadedTowerId = null;
      }
    } else if (
      this.state.phase === "defending" &&
      this.enemies.some((enemy) => enemy.alive && !enemy.reachedBase)
    ) {
      this.overloadCharge = Math.min(1, this.overloadCharge + sdt / this.overloadChargeSeconds);
    }
    this.updateSpawning(sdt);
    this.updateEnemies(sdt);
    this.updateTowers(sdt);
    this.updateProjectiles(sdt);
    this.updateEffects(sdt);
    this.cleanup();
    this.checkWaveEnd();
  }

  private announce(text: string): void {
    this.messages.push(text);
    if (this.messages.length > 4) this.messages.shift();
  }

  private updateSpawning(dt: number): void {
    if (this.state.phase !== "defending" || this.spawnQueueFinished) return;
    this.spawnElapsed += dt;
    while (
      this.spawnIndex < this.spawnQueue.length &&
      this.spawnQueue[this.spawnIndex].at <= this.spawnElapsed
    ) {
      const item = this.spawnQueue[this.spawnIndex++];
      this.enemies.push(createEnemy(this.nextEnemyId++, item.kind, this.spawnQueueWave, levelDifficultyMultiplier(this.level)));
    }

    if (this.spawnIndex >= this.spawnQueue.length) {
      this.spawnQueueFinished = true;
      this.wavesAwaitingClear.add(this.spawnQueueWave);
      this.earlyWindowRemaining = EARLY_WAVE_WINDOW_SECONDS;
    }
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.reachedBase) continue;
      advanceEnemy(enemy, dt);
      if (enemy.distance >= this.totalPathLength) {
        enemy.distance = this.totalPathLength;
        enemy.reachedBase = true;
      }
    }
  }

  private updateTowers(dt: number): void {
    for (const tower of this.towers) {
      tower.cooldown -= dt;
      const baseStats = this.effectiveTowerStats(tower.kind, tower.level);
      const overloaded = this.overloadedTowerId === tower.id && this.overloadRemaining > 0;
      const overloadStats = overloadUpgradeStats(this.progress.upgrades.overload ?? 0);
      const stats = overloaded
        ? { ...baseStats, damage: baseStats.damage * overloadStats.damageMultiplier, fireRate: baseStats.fireRate * overloadStats.fireRateMultiplier, slowFactor: tower.kind === "frost" ? 0.2 : baseStats.slowFactor }
        : baseStats;
      if (tower.kind === "frost") {
        applyFrostAura(
          this.enemies,
          towerPosition(tower),
          stats.range,
          stats.slowFactor ?? 0.5,
          Math.max(dt * 2, 0.05),
        );
        tower.cooldown = 0;
        continue;
      }
      if (tower.cooldown > 0) continue;
      const target = findTarget(tower, stats, this.enemies);
      if (!target) continue;

      const origin = towerPosition(tower);
      const targetPos = enemyPosition(target);
      tower.angle = Math.atan2(targetPos.y - origin.y, targetPos.x - origin.x);

      if (tower.kind === "tesla") {
        this.fireTesla(tower, stats.chain ?? 1, stats.damage);
      } else {
        this.projectiles.push({
          id: this.nextProjectileId++,
          x: origin.x,
          y: origin.y,
          targetId: target.id,
          speed: stats.projectileSpeed,
          damage: stats.damage,
          kind: tower.kind,
          splash: stats.splash,
          slowFactor: stats.slowFactor,
          slowDuration: stats.slowDuration,
          dead: false,
        });
      }
      tower.cooldown = 1 / Math.max(0.05, stats.fireRate);
    }
  }

  private fireTesla(tower: Tower, chainCount: number, damage: number): void {
    const hitIds = new Set<number>();
    let current: Enemy | null = findTarget(tower, this.effectiveTowerStats("tesla", tower.level), this.enemies);
    let from = towerPosition(tower);

    for (let i = 0; i < chainCount && current; i++) {
      const pos = enemyPosition(current);
      this.addBeam(from, pos);
      applyHit(this.enemies, current, damage);
      hitIds.add(current.id);
      from = pos;

      let nearest: Enemy | null = null;
      let nearestDist = Infinity;
      for (const enemy of this.enemies) {
        if (hitIds.has(enemy.id) || !isTargetable(enemy)) continue;
        const p = enemyPosition(enemy);
        const d = Math.hypot(p.x - pos.x, p.y - pos.y);
        if (d <= TESLA_CHAIN_RANGE && d < nearestDist) {
          nearestDist = d;
          nearest = enemy;
        }
      }
      current = nearest;
    }
  }

  private updateProjectiles(dt: number): void {
    for (const projectile of this.projectiles) {
      if (projectile.dead) continue;
      const target = this.enemies.find((e) => e.id === projectile.targetId);
      if (!target || !isTargetable(target)) {
        projectile.dead = true;
        continue;
      }
      const pos = enemyPosition(target);
      const dx = pos.x - projectile.x;
      const dy = pos.y - projectile.y;
      const dist = Math.hypot(dx, dy);
      const step = projectile.speed * dt;

      if (dist <= step || dist < 1) {
        projectile.x = pos.x;
        projectile.y = pos.y;
        if (projectile.splash) {
          this.addFlash(pos.x, pos.y, projectile.splash);
        }
        applyHit(this.enemies, target, projectile.damage, {
          splash: projectile.splash,
          slowFactor: projectile.slowFactor,
          slowDuration: projectile.slowDuration,
        });
        projectile.dead = true;
      } else {
        projectile.x += (dx / dist) * step;
        projectile.y += (dy / dist) * step;
      }
    }
  }

  private updateEffects(dt: number): void {
    for (const beam of this.beams) beam.life -= dt;
    for (const flash of this.flashes) flash.life -= dt;
    this.beams = this.beams.filter((b) => b.life > 0);
    this.flashes = this.flashes.filter((f) => f.life > 0);
  }

  private addBeam(a: Vec, b: Vec): void {
    this.beams.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, life: 0.12, maxLife: 0.12 });
  }

  private addFlash(x: number, y: number, radius: number): void {
    this.flashes.push({ x, y, radius, life: 0.18, maxLife: 0.18 });
  }

  private cleanup(): void {
    const survivors: Enemy[] = [];
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        this.state.gold += Math.round(enemy.reward * upgradeMultiplier(this.progress.upgrades.killGold ?? 0));
        this.progressRevision += awardExperience(this.progress, experienceForKill(this.level, enemy.wave));
        continue;
      }
      if (enemy.reachedBase) {
        this.state.lives -= this.leakDamage(enemy);
        continue;
      }
      survivors.push(enemy);
    }
    this.enemies = survivors;
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    if (this.state.lives <= 0) {
      this.state.lives = 0;
      this.state.phase = "gameover";
      this.bestWave = Math.max(this.bestWave, this.state.wave);
      this.recordCurrentWave();
      this.announce("¡Base destruida!");
    }
  }

  private leakDamage(enemy: Enemy): number {
    return enemy.kind === "boss" ? 5 : 1;
  }

  private checkWaveEnd(): void {
    if (this.state.phase === "gameover" || this.state.phase === "victory") return;

    for (const wave of this.wavesAwaitingClear) {
      if (this.enemies.some((enemy) => enemy.wave === wave)) continue;
      this.state.gold += waveRewardBonus(wave);
      this.wavesAwaitingClear.delete(wave);
      this.progressRevision += awardExperience(this.progress, experienceForWave(this.level, wave));
      this.recordCurrentWave(wave);
      this.announce(`Oleada ${wave} completada: +${waveRewardBonus(wave)} oro`);
    }

    if (this.state.phase !== "defending") return;
    if (!this.spawnQueueFinished || this.enemies.length > 0 || this.wavesAwaitingClear.size > 0) return;

    this.state.wave += 1;
    this.state.phase = "build";
    const unlocked = this.unlockedNow();
    if (unlocked) this.announce(`Nueva torreta: ${TOWERS[unlocked].name}`);
  }

  private unlockedNow(): TowerKind | null {
    for (const kind of Object.keys(TOWERS) as TowerKind[]) {
      if (TOWERS[kind].unlockWave === this.state.wave) return kind;
    }
    return null;
  }

  enemyLeakDamage(enemy: Enemy): number {
    return this.leakDamage(enemy);
  }

  enemyDef(kind: EnemyKind) {
    return ENEMIES[kind];
  }

  towerCenter(tower: Tower): Vec {
    return cellCenter(tower.col, tower.row);
  }

  get bestWaveLabel(): string {
    return `Mejor oleada: ${this.bestWave}`;
  }
}
