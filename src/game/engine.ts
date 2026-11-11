import { sound } from './audio';
import {
  PlayerStats,
  INITIAL_PLAYER_STATS,
  getXpForLevel,
  calculateDamage,
  getWaveConfig,
  applyPerkToStats,
  checkCircleCollision,
  checkHeroPromotion,
  applyPromotionBonus,
} from './rules';
import { rollThreePerks } from './perks';
import { heroSprite, Direction } from './heroSprite';
import {
  GameConfig,
  CampaignStage,
  HeroClass,
  HeroPromotionConfig,
  EnemyType,
  loadGameConfig,
  PRESET_BACKGROUND_IMAGES,
  DEFAULT_CAMPAIGN_STAGES,
  DEFAULT_HERO_CLASSES,
} from './customConfig';
import { getSpriteById, renderSpriteInCanvas } from './spriteLibrary';

export interface RunStats {
  survivedTime: number;
  kills: number;
  level: number;
  damageDealt: number;
  gemsCollected: number;
  revivedCount: number;
}

export interface SkillHudItem {
  id: string;
  name: string;
  emoji: string;
  category: 'weapon' | 'passive';
  tier: 'common' | 'rare' | 'epic';
  level: number;
  maxLevel: number;
  cooldownPercent: number; // 0 to 1 (1 = ready to fire, 0 = on cooldown)
  cooldownRemaining?: number; // seconds remaining
  isReady: boolean;
}

export interface LiveHudState {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpNeeded: number;
  timeLeft: number;
  kills: number;
  phaseText: string;
  isPromoted?: boolean;
  heroName?: string;
  promotedTitle?: string;
  skills?: SkillHudItem[];
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type?: 'spark' | 'sakura' | 'ember' | 'stardust' | 'snow';
  rotation?: number;
  vRot?: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  scale: number;
  alpha: number;
  vy: number;
  life: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  type: EnemyType;
  color: string;
  name: string;
  emoji: string;
  customImageUrl?: string;
  spriteId?: string;
  damage: number;
  exp: number;
  hitFlash: number;
  vx: number;
  vy: number;
  wobble: number;
  shootTimer?: number;
}

interface Gem {
  id: number;
  x: number;
  y: number;
  value: number;
  color: string;
  radius: number;
  vx: number;
  vy: number;
  beingAttracted: boolean;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isCrit: boolean;
  pierce: number;
  hitEnemies: Set<number>;
  life: number;
  type: 'dagger' | 'enemy_arrow' | 'lich_soul' | 'spider_spit' | 'fox_fire';
}

interface Orbiter {
  angle: number;
  radius: number;
  damage: number;
}

interface ThunderVisual {
  x: number;
  y: number;
  points: { x: number; y: number }[];
  life: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number = 0;
  private lastTime: number = 0;

  // Custom Configuration from Design Studio
  public config: GameConfig;

  // Background and Enemy Images Cache
  private bgImage: HTMLImageElement | null = null;
  private isBgLoaded: boolean = false;
  private enemyImageCache: Map<string, HTMLImageElement> = new Map();

  // Game state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public state: 'title' | 'playing' | 'paused' | 'level_up' | 'ad_modal' | 'gameover' | 'victory' = 'title';

  // Player & Directional Sprite
  public playerStats: PlayerStats = { ...INITIAL_PLAYER_STATS };
  public playerX: number = 0;
  public playerY: number = 0;
  public playerDirection: Direction = 'down';
  public playerWalkCycle: number = 0;
  public isMoving: boolean = false;
  public invulnerabilityTimer: number = 0;

  // Run progress
  public level: number = 1;
  public xp: number = 0;
  public xpNeeded: number = getXpForLevel(1);
  public gameTimer: number = 60.0;
  public kills: number = 0;
  public totalDamageDealt: number = 0;
  public gemsCollected: number = 0;
  public revivedCount: number = 0;
  public acquiredPerks: Record<string, number> = {};

  // Combat & Magic
  private daggerCooldown: number = 0;
  private thunderTimer: number = 0;
  private orbiters: Orbiter[] = [];
  private orbiterBaseAngle: number = 0;
  private spawnTimer: number = 0;
  private ambientSpawnTimer: number = 0;
  private magicCircleRotation: number = 0;
  private nextEnemyId: number = 1;
  private nextProjId: number = 1;
  private nextGemId: number = 1;
  private nextTextId: number = 1;

  // Collections
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private gems: Gem[] = [];
  private floatingTexts: FloatingText[] = [];
  private thunderVisuals: ThunderVisual[] = [];

  // Particle pool (350 particles)
  private particlePool: Particle[] = [];
  private particleIndex: number = 0;

  // Camera & Juice
  private cameraTrauma: number = 0;
  private hitstopTimer: number = 0;
  private nukeShockwave: { x: number; y: number; radius: number; maxRadius: number; active: boolean } | null = null;

  // Single-hand Touch / Mouse Drag Joystick
  public touchActive: boolean = false;
  public touchOriginX: number = 0;
  public touchOriginY: number = 0;
  public touchCurrentX: number = 0;
  public touchCurrentY: number = 0;
  private keysPressed: Set<string> = new Set();

  // Callbacks
  public onHudUpdate?: (hud: LiveHudState) => void;
  public onLevelUpPrompt?: (perks: ReturnType<typeof rollThreePerks>) => void;
  public onGameOverPrompt?: (stats: RunStats) => void;
  public onVictoryPrompt?: (stats: RunStats) => void;
  public onPromotionPrompt?: (promo: HeroPromotionConfig) => void;

  // Class Promotion / Awakening State
  public isPromoted: boolean = false;
  public promotedConfig: HeroPromotionConfig | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    if (typeof window !== 'undefined') {
      (window as any).__gameEngine = this;
    }

    // Load initial config
    this.config = loadGameConfig();
    this.loadBackgroundFromConfig();

    // Pre-allocate particle pool
    for (let i = 0; i < 350; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#fff',
        alpha: 1,
        life: 0,
        maxLife: 0.5,
        type: 'spark',
        rotation: 0,
        vRot: 0,
      });
    }

    this.setupListeners();
    this.handleResize();
  }

  public getCurrentStage(): CampaignStage {
    const stage = this.config.stages.find((s) => s.id === this.config.currentStageId);
    return stage || this.config.stages[0] || DEFAULT_CAMPAIGN_STAGES[0];
  }

  public getCurrentHeroClass(): HeroClass {
    const hero = this.config.heroClasses.find((h) => h.id === this.config.selectedHeroClassId);
    return hero || this.config.heroClasses[0] || DEFAULT_HERO_CLASSES[0];
  }

  public applyConfig(newConfig: GameConfig) {
    this.config = JSON.parse(JSON.stringify(newConfig));
    this.loadBackgroundFromConfig();
    this.preloadEnemyImages();
  }

  private loadBackgroundFromConfig() {
    const stage = this.getCurrentStage();
    let src = '';
    if (stage.backgroundPreset === 'custom' && stage.customBackgroundUrl) {
      src = stage.customBackgroundUrl;
    } else {
      src = PRESET_BACKGROUND_IMAGES[stage.backgroundPreset] || PRESET_BACKGROUND_IMAGES.sakura_shrine;
    }

    this.bgImage = new Image();
    this.bgImage.src = src;
    this.bgImage.onload = () => {
      this.isBgLoaded = true;
    };
    this.bgImage.onerror = () => {
      this.isBgLoaded = false;
    };
  }

  private preloadEnemyImages() {
    for (const enemyCfg of this.config.enemies) {
      if (enemyCfg.customImageUrl && !this.enemyImageCache.has(enemyCfg.customImageUrl)) {
        const img = new Image();
        img.src = enemyCfg.customImageUrl;
        this.enemyImageCache.set(enemyCfg.customImageUrl, img);
      }
    }
  }

  public handleResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  private setupListeners() {
    window.addEventListener('resize', () => this.handleResize());

    const onStart = (clientX: number, clientY: number) => {
      if (this.state !== 'playing') return;
      this.touchActive = true;
      this.touchOriginX = clientX;
      this.touchOriginY = clientY;
      this.touchCurrentX = clientX;
      this.touchCurrentY = clientY;
    };

    const onMove = (clientX: number, clientY: number) => {
      if (!this.touchActive) return;
      this.touchCurrentX = clientX;
      this.touchCurrentY = clientY;
    };

    const onEnd = () => {
      this.touchActive = false;
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onStart(e.clientX, e.clientY);
    });

    window.addEventListener('pointermove', (e) => {
      onMove(e.clientX, e.clientY);
    });

    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);

    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);
      if (e.code === 'KeyM') {
        sound.toggleMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keysPressed.clear();
      this.touchActive = false;
    });
  }

  public startNewGame(stageId?: string, heroClassId?: string) {
    if (stageId) this.config.currentStageId = stageId;
    if (heroClassId) this.config.selectedHeroClassId = heroClassId;

    this.loadBackgroundFromConfig();
    this.handleResize();
    const rect = this.canvas.getBoundingClientRect();
    this.playerX = rect.width / 2;
    this.playerY = rect.height / 2;
    this.playerDirection = 'down';

    const stage = this.getCurrentStage();
    const hero = this.getCurrentHeroClass();

    // Initialize player stats from selected Hero Class
    this.playerStats = {
      hp: hero.initialHp,
      maxHp: hero.initialHp,
      speed: hero.initialSpeed,
      attackDamage: hero.baseDamage,
      attackSpeed: hero.attackSpeed,
      attackRange: 280,
      critRate: hero.critRate,
      critMultiplier: hero.critMultiplier,
      projectileCount: 1,
      pierce: 1,
      orbitersCount: 0,
      thunderCooldown: 3.5,
      magnetRange: hero.magnetRange,
      damageReduction: hero.damageReduction,
    };

    this.level = 1;
    this.xp = 0;
    this.xpNeeded = getXpForLevel(1);
    this.gameTimer = stage.survivalTime || 60.0;
    this.kills = 0;
    this.totalDamageDealt = 0;
    this.gemsCollected = 0;
    this.revivedCount = 0;
    this.acquiredPerks = {};
    this.isPromoted = false;
    this.promotedConfig = null;

    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.floatingTexts = [];
    this.thunderVisuals = [];
    this.orbiters = [];
    this.nukeShockwave = null;
    this.cameraTrauma = 0;
    this.hitstopTimer = 0;
    this.invulnerabilityTimer = 1.0;

    // Equip hero's initial weapon
    if (hero.initialWeapon) {
      this.acquiredPerks[hero.initialWeapon] = 1;
      this.playerStats = applyPerkToStats(this.playerStats, hero.initialWeapon, 1, this.config.perks);
      if (this.playerStats.orbitersCount > 0) {
        this.orbiters.push({
          angle: 0,
          radius: 76,
          damage: Math.round(this.playerStats.attackDamage * 0.8),
        });
      }
    }

    // Preload custom images
    this.preloadEnemyImages();

    // Spawn initial ambient particles
    for (let i = 0; i < 24; i++) {
      this.spawnAmbientParticle(rect.width, rect.height, true);
    }

    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  public resumeGame() {
    if (this.state === 'level_up' || this.state === 'paused' || this.state === 'ad_modal') {
      this.state = 'playing';
      document.body.dataset.state = 'playing';
      this.isPaused = false;
      this.lastTime = performance.now();
    }
  }

  public pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      document.body.dataset.state = 'paused';
      this.isPaused = true;
    }
  }

  public addXp(amount: number) {
    this.collectXp(amount);
  }

  public triggerAdRevive() {
    sound.playNukeBomb();
    sound.playRewardDing();
    this.revivedCount++;
    this.playerStats.hp = this.playerStats.maxHp;
    this.invulnerabilityTimer = 3.5;

    const rect = this.canvas.getBoundingClientRect();
    this.nukeShockwave = {
      x: this.playerX,
      y: this.playerY,
      radius: 10,
      maxRadius: Math.max(rect.width, rect.height) * 1.6,
      active: true,
    };
    this.cameraTrauma = 1.0;

    const killedCount = this.enemies.length;
    for (const enemy of this.enemies) {
      this.kills++;
      this.spawnGem(enemy.x, enemy.y, enemy.exp * 2);
      this.spawnBloodExplosion(enemy.x, enemy.y, '#f59e0b', 14);
    }
    this.enemies = [];

    this.spawnFloatingText(
      this.playerX,
      this.playerY - 45,
      `【全画面消滅・復活】撃破 +${killedCount} 隻！`,
      '#fde047',
      1.4
    );

    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public selectPerk(perkId: string) {
    const curLvl = this.acquiredPerks[perkId] || 0;
    this.acquiredPerks[perkId] = curLvl + 1;
    this.playerStats = applyPerkToStats(this.playerStats, perkId, curLvl + 1, this.config.perks);

    if (this.playerStats.orbitersCount > this.orbiters.length) {
      const needed = this.playerStats.orbitersCount - this.orbiters.length;
      for (let i = 0; i < needed; i++) {
        this.orbiters.push({
          angle: (Math.PI * 2 * this.orbiters.length) / Math.max(1, this.playerStats.orbitersCount),
          radius: 76,
          damage: Math.round(this.playerStats.attackDamage * 0.8),
        });
      }
    }

    sound.playRewardDing();
    this.checkPromotionStatus();
    this.resumeGame();
  }

  public selectAllThreePerks(perkIds: string[]) {
    sound.playRewardDing();
    for (const id of perkIds) {
      const curLvl = this.acquiredPerks[id] || 0;
      this.acquiredPerks[id] = curLvl + 1;
      this.playerStats = applyPerkToStats(this.playerStats, id, curLvl + 1, this.config.perks);
    }

    if (this.playerStats.orbitersCount > this.orbiters.length) {
      const needed = this.playerStats.orbitersCount - this.orbiters.length;
      for (let i = 0; i < needed; i++) {
        this.orbiters.push({
          angle: (Math.PI * 2 * this.orbiters.length) / Math.max(1, this.playerStats.orbitersCount),
          radius: 76,
          damage: Math.round(this.playerStats.attackDamage * 0.8),
        });
      }
    }

    this.spawnFloatingText(this.playerX, this.playerY - 35, '★ 三大能力一斉解放！神威覚醒！ ★', '#38bdf8', 1.35);
    this.checkPromotionStatus();
    this.resumeGame();
  }

  private checkPromotionStatus() {
    if (this.isPromoted) return;
    const hero = this.getCurrentHeroClass();
    if (!hero.promotion) return;

    if (checkHeroPromotion(hero, this.acquiredPerks)) {
      this.isPromoted = true;
      this.promotedConfig = hero.promotion;
      this.playerStats = applyPromotionBonus(this.playerStats, hero.promotion);

      sound.playLevelUp();
      sound.playRewardDing();
      this.cameraTrauma = 0.85;

      // Burst of divine celebration particles
      const color = hero.promotion.auraColor || '#facc15';
      this.spawnBloodExplosion(this.playerX, this.playerY, color, 30);
      this.spawnFloatingText(
        this.playerX,
        this.playerY - 45,
        `★ 職業覺醒！【${hero.promotion.promotedTitle}】 ★`,
        color,
        1.5
      );

      this.onPromotionPrompt?.(hero.promotion);
    }
  }

  private loop(currentTime: number) {
    if (!this.isRunning) return;

    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const dt = Math.min(rawDt, 0.05);

    if (this.state === 'playing') {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.update(dt);
      }
    }

    this.render();

    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const stage = this.getCurrentStage();
    const totalTime = stage.survivalTime || 60.0;
    const elapsed = totalTime - this.gameTimer;

    // 1. Countdown timer
    this.gameTimer = Math.max(0, this.gameTimer - dt);

    // Check Victory
    if (this.gameTimer <= 0) {
      this.state = 'victory';
      document.body.dataset.state = 'gameover';
      sound.playVictory();
      for (const e of this.enemies) {
        this.spawnBloodExplosion(e.x, e.y, '#f59e0b', 10);
      }
      this.enemies = [];
      this.onVictoryPrompt?.({
        survivedTime: totalTime,
        kills: this.kills,
        level: this.level,
        damageDealt: this.totalDamageDealt,
        gemsCollected: this.gemsCollected,
        revivedCount: this.revivedCount,
      });
      return;
    }

    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= dt;
    }

    this.magicCircleRotation += dt * 0.8;

    // 2. Ambient Particles Spawning
    this.ambientSpawnTimer += dt;
    if (this.ambientSpawnTimer >= 0.14) {
      this.ambientSpawnTimer = 0;
      this.spawnAmbientParticle(w, h, false);
    }

    // 3. Player Movement & Directional Calculation (4 directions: down, up, left, right)
    let moveX = 0;
    let moveY = 0;

    if (this.touchActive) {
      const dx = this.touchCurrentX - this.touchOriginX;
      const dy = this.touchCurrentY - this.touchOriginY;
      const dist = Math.hypot(dx, dy);
      const deadzone = 8;
      const maxDrag = 60;

      if (dist > deadzone) {
        const factor = Math.min(1, (dist - deadzone) / (maxDrag - deadzone));
        moveX = (dx / dist) * factor;
        moveY = (dy / dist) * factor;
      }
    }

    if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) moveY -= 1;
    if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) moveY += 1;
    if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) moveX -= 1;
    if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) moveX += 1;

    const moveMag = Math.hypot(moveX, moveY);
    if (moveMag > 0) {
      const normX = (moveX / moveMag) * Math.min(1, moveMag);
      const normY = (moveY / moveMag) * Math.min(1, moveMag);

      this.playerX += normX * this.playerStats.speed * dt;
      this.playerY += normY * this.playerStats.speed * dt;

      const padding = 28;
      this.playerX = Math.max(padding, Math.min(w - padding, this.playerX));
      this.playerY = Math.max(padding, Math.min(h - padding, this.playerY));

      // Calculate 4 cardinal directions
      if (Math.abs(normX) > Math.abs(normY)) {
        this.playerDirection = normX > 0 ? 'right' : 'left';
      } else {
        this.playerDirection = normY > 0 ? 'down' : 'up';
      }

      this.playerWalkCycle += dt * 14;
      this.isMoving = true;

      // Magical walking sparkle trail
      if (Math.random() < 0.4) {
        this.spawnParticle(
          this.playerX + (Math.random() - 0.5) * 12,
          this.playerY + 16,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10,
          3,
          'rgba(56, 189, 248, 0.7)',
          0.35,
          'spark'
        );
      }
    } else {
      this.isMoving = false;
      this.playerWalkCycle = 0;
    }

    // 4. Weapons Firing
    this.daggerCooldown -= dt * this.playerStats.attackSpeed;
    if (this.daggerCooldown <= 0 && this.enemies.length > 0) {
      this.fireHolyDaggers();
      this.daggerCooldown = 0.52;
    }

    this.orbiterBaseAngle += dt * 3.0;
    for (let i = 0; i < this.orbiters.length; i++) {
      const orb = this.orbiters[i];
      const angle = this.orbiterBaseAngle + (Math.PI * 2 * i) / this.orbiters.length;
      const ox = this.playerX + Math.cos(angle) * orb.radius;
      const oy = this.playerY + Math.sin(angle) * orb.radius;

      for (const enemy of this.enemies) {
        if (checkCircleCollision(ox, oy, 16, enemy.x, enemy.y, enemy.radius)) {
          this.damageEnemy(enemy, orb.damage * dt * 3.8, false, ox, oy);
        }
      }
    }

    this.thunderTimer -= dt;
    if (this.thunderTimer <= 0 && this.enemies.length > 0) {
      this.castThunderstorm();
      this.thunderTimer = this.playerStats.thunderCooldown;
    }

    // 5. Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.life <= 0 || p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.type === 'dagger') {
        for (const enemy of this.enemies) {
          if (p.hitEnemies.has(enemy.id)) continue;
          if (checkCircleCollision(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) {
            p.hitEnemies.add(enemy.id);
            this.damageEnemy(enemy, p.damage, p.isCrit, p.x, p.y);
            sound.playHit();

            p.pierce -= 1;
            if (p.pierce <= 0) {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      } else if (
        p.type === 'enemy_arrow' ||
        p.type === 'lich_soul' ||
        p.type === 'spider_spit' ||
        p.type === 'fox_fire'
      ) {
        if (this.invulnerabilityTimer <= 0 && checkCircleCollision(p.x, p.y, p.radius, this.playerX, this.playerY, 16)) {
          this.hurtPlayer(p.damage);
          const impactColor = p.type === 'spider_spit' ? '#22c55e' : p.type === 'lich_soul' ? '#a855f7' : '#ef4444';
          this.spawnBloodExplosion(p.x, p.y, impactColor, 7);
          this.projectiles.splice(i, 1);
        }
      }
    }

    // 6. Enemy Spawning & Wave Scaling
    const wave = getWaveConfig(elapsed, stage);
    this.spawnTimer += dt;
    if (this.spawnTimer >= wave.spawnInterval && this.enemies.length < wave.maxEnemies) {
      this.spawnTimer = 0;
      this.spawnEnemy(wave.allowedTypes);
    }

    // 7. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hitFlash > 0) e.hitFlash -= dt;

      e.vx *= 0.88;
      e.vy *= 0.88;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.wobble += dt * 6;

      const dx = this.playerX - e.x;
      const dy = this.playerY - e.y;
      const dist = Math.hypot(dx, dy);

      if (e.type === 'archer') {
        e.shootTimer = (e.shootTimer || 0) + dt;
        if (dist > 190) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        } else if (dist < 130) {
          e.x -= (dx / dist) * (e.speed * 0.6) * dt;
          e.y -= (dy / dist) * (e.speed * 0.6) * dt;
        }
        if (e.shootTimer >= 2.2) {
          e.shootTimer = 0;
          this.fireEnemyArrow(e.x, e.y, this.playerX, this.playerY);
        }
      } else if (e.type === 'lich') {
        e.shootTimer = (e.shootTimer || 0) + dt;
        if (dist > 210) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        } else if (dist < 140) {
          e.x -= (dx / dist) * (e.speed * 0.65) * dt;
          e.y -= (dy / dist) * (e.speed * 0.65) * dt;
        }
        if (e.shootTimer >= 2.5) {
          e.shootTimer = 0;
          this.fireEnemyLichSoul(e.x, e.y, this.playerX, this.playerY);
        }
      } else if (e.type === 'spider') {
        e.shootTimer = (e.shootTimer || 0) + dt;
        const perpX = -dy / (dist || 1);
        const perpY = dx / (dist || 1);
        const zigzag = Math.sin(e.wobble * 2.5) * 48;
        e.x += ((dx / (dist || 1)) * e.speed + perpX * zigzag) * dt;
        e.y += ((dy / (dist || 1)) * e.speed + perpY * zigzag) * dt;
        if (e.shootTimer >= 2.0) {
          e.shootTimer = 0;
          this.fireEnemySpiderSpit(e.x, e.y, this.playerX, this.playerY);
        }
      } else if (e.type === 'nine_tails') {
        e.shootTimer = (e.shootTimer || 0) + dt;
        if (dist > 2) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        }
        if (e.shootTimer >= 2.4) {
          e.shootTimer = 0;
          this.fireNineTailsFoxFire(e.x, e.y, this.playerX, this.playerY);
        }
      } else if (e.type === 'ghost') {
        const perpX = -dy / (dist || 1);
        const perpY = dx / (dist || 1);
        const sway = Math.sin(e.wobble * 1.6) * 32;
        e.x += ((dx / (dist || 1)) * e.speed + perpX * sway) * dt;
        e.y += ((dy / (dist || 1)) * e.speed + perpY * sway) * dt;
      } else if (e.type === 'flame_spirit') {
        if (dist > 2) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        }
        if (Math.random() < 0.22) {
          this.spawnParticle(e.x, e.y, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 3, '#f97316', 0.4, 'ember');
        }
      } else {
        if (dist > 2) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        }
      }

      if (dist < e.radius + 15 && this.invulnerabilityTimer <= 0) {
        this.hurtPlayer(e.damage);
      }

      if (e.hp <= 0) {
        this.kills++;
        this.spawnGem(e.x, e.y, e.exp);
        this.spawnBloodExplosion(e.x, e.y, e.color, e.type === 'boss' || e.type === 'nine_tails' ? 32 : 10);
        if (e.type === 'golem') {
          this.cameraTrauma = Math.min(1.0, this.cameraTrauma + 0.35);
        }
        this.enemies.splice(i, 1);
      }
    }

    // 8. Update XP Gems
    const magnetR = this.playerStats.magnetRange;
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const dx = this.playerX - g.x;
      const dy = this.playerY - g.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetR || g.beingAttracted) {
        g.beingAttracted = true;
        const pullSpeed = Math.min(520, 190 + (magnetR - dist) * 4.2);
        g.vx = (dx / (dist || 1)) * pullSpeed;
        g.vy = (dy / (dist || 1)) * pullSpeed;
        g.x += g.vx * dt;
        g.y += g.vy * dt;
      }

      if (dist < 20) {
        sound.playGemCollect();
        this.collectXp(g.value);
        this.gemsCollected++;
        this.gems.splice(i, 1);
      }
    }

    // 9. Nuke Shockwave
    if (this.nukeShockwave && this.nukeShockwave.active) {
      this.nukeShockwave.radius += dt * 1500;
      if (this.nukeShockwave.radius >= this.nukeShockwave.maxRadius) {
        this.nukeShockwave.active = false;
      }
    }

    // 10. Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 0.8);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 11. Particles
    for (const p of this.particlePool) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot * dt;
      }
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        p.active = false;
      }
    }

    // 12. Camera trauma decay
    if (this.cameraTrauma > 0) {
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.2);
    }

    // 13. Notify React HUD
    const bossTime = stage.bossWaveTime || Math.floor(totalTime * 0.83);
    let phase = '第壱波：妖魔急襲 (Wave 1)';
    if (elapsed >= bossTime) phase = '⚠️ 最終決戰：極致魔王降臨！ (Final Boss)';
    else if (elapsed >= bossTime * 0.65) phase = '第参波：百鬼夜行 (Wave 3: Horde)';
    else if (elapsed >= bossTime * 0.35) phase = '第弐波：冥界狂嵐 (Wave 2)';

    const hero = this.getCurrentHeroClass();

    // Build skills array with levels and cooldowns
    const skills: SkillHudItem[] = Object.entries(this.acquiredPerks).map(([perkId, lvl]) => {
      const cfg = this.config.perks.find((p) => p.id === perkId) || {
        id: perkId,
        name: perkId,
        emoji: '✨',
        category: 'passive' as const,
        tier: 'common' as const,
        maxLevel: 5,
        desc: '',
      };

      let cooldownPercent = 1;
      let cooldownRemaining = 0;
      let isReady = true;

      if (perkId === 'holy_dagger' || perkId === 'giant_cleave' || perkId === 'rapid_wand') {
        const maxCd = 0.52 / Math.max(0.2, this.playerStats.attackSpeed);
        const rem = Math.max(0, this.daggerCooldown);
        cooldownRemaining = rem;
        cooldownPercent = Math.max(0, Math.min(1, 1 - (rem / maxCd)));
        isReady = rem <= 0.05;
      } else if (perkId === 'thunder_strike') {
        const maxCd = Math.max(0.5, this.playerStats.thunderCooldown);
        const rem = Math.max(0, this.thunderTimer);
        cooldownRemaining = rem;
        cooldownPercent = Math.max(0, Math.min(1, 1 - (rem / maxCd)));
        isReady = rem <= 0.05;
      } else {
        cooldownPercent = 1;
        cooldownRemaining = 0;
        isReady = true;
      }

      return {
        id: perkId,
        name: cfg.name,
        emoji: cfg.emoji,
        category: cfg.category,
        tier: cfg.tier,
        level: lvl,
        maxLevel: cfg.maxLevel || 5,
        cooldownPercent,
        cooldownRemaining,
        isReady,
      };
    });

    this.onHudUpdate?.({
      hp: Math.round(this.playerStats.hp),
      maxHp: this.playerStats.maxHp,
      level: this.level,
      xp: this.xp,
      xpNeeded: this.xpNeeded,
      timeLeft: Math.max(0, this.gameTimer),
      kills: this.kills,
      phaseText: phase,
      isPromoted: this.isPromoted,
      heroName: hero.name,
      promotedTitle: this.isPromoted && this.promotedConfig ? this.promotedConfig.promotedTitle : undefined,
      skills,
    });
  }

  private fireHolyDaggers() {
    sound.playShoot();
    const sorted = [...this.enemies].sort((a, b) => {
      const da = Math.hypot(a.x - this.playerX, a.y - this.playerY);
      const db = Math.hypot(b.x - this.playerX, b.y - this.playerY);
      return da - db;
    });

    const count = this.playerStats.projectileCount;
    for (let i = 0; i < count; i++) {
      const target = sorted[i % sorted.length];
      let angle = Math.atan2(target.y - this.playerY, target.x - this.playerX);
      if (count > 1) {
        angle += (i - (count - 1) / 2) * 0.24;
      }

      const { damage, isCrit } = calculateDamage(
        this.playerStats.attackDamage,
        this.playerStats.critRate,
        this.playerStats.critMultiplier
      );

      this.projectiles.push({
        id: this.nextProjId++,
        x: this.playerX,
        y: this.playerY,
        vx: Math.cos(angle) * 460,
        vy: Math.sin(angle) * 460,
        radius: 9,
        damage,
        isCrit,
        pierce: this.playerStats.pierce,
        hitEnemies: new Set(),
        life: 1.5,
        type: 'dagger',
      });
    }
  }

  private fireEnemyArrow(x: number, y: number, targetX: number, targetY: number) {
    const angle = Math.atan2(targetY - y, targetX - x);
    this.projectiles.push({
      id: this.nextProjId++,
      x,
      y,
      vx: Math.cos(angle) * 210,
      vy: Math.sin(angle) * 210,
      radius: 5,
      damage: 10,
      isCrit: false,
      pierce: 1,
      hitEnemies: new Set(),
      life: 2.5,
      type: 'enemy_arrow',
    });
  }

  private fireEnemyLichSoul(x: number, y: number, targetX: number, targetY: number) {
    const angle = Math.atan2(targetY - y, targetX - x);
    this.projectiles.push({
      id: this.nextProjId++,
      x,
      y,
      vx: Math.cos(angle) * 165,
      vy: Math.sin(angle) * 165,
      radius: 8,
      damage: 18,
      isCrit: false,
      pierce: 1,
      hitEnemies: new Set(),
      life: 3.2,
      type: 'lich_soul',
    });
  }

  private fireEnemySpiderSpit(x: number, y: number, targetX: number, targetY: number) {
    const angle = Math.atan2(targetY - y, targetX - x);
    this.projectiles.push({
      id: this.nextProjId++,
      x,
      y,
      vx: Math.cos(angle) * 230,
      vy: Math.sin(angle) * 230,
      radius: 6,
      damage: 12,
      isCrit: false,
      pierce: 1,
      hitEnemies: new Set(),
      life: 2.2,
      type: 'spider_spit',
    });
  }

  private fireNineTailsFoxFire(x: number, y: number, targetX: number, targetY: number) {
    const baseAngle = Math.atan2(targetY - y, targetX - x);
    const spread = [-0.28, 0, 0.28];
    for (const offset of spread) {
      this.projectiles.push({
        id: this.nextProjId++,
        x,
        y,
        vx: Math.cos(baseAngle + offset) * 190,
        vy: Math.sin(baseAngle + offset) * 190,
        radius: 9,
        damage: 20,
        isCrit: false,
        pierce: 1,
        hitEnemies: new Set(),
        life: 3.0,
        type: 'fox_fire',
      });
    }
  }

  private castThunderstorm() {
    sound.playThunder();
    const targets = [...this.enemies].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const target of targets) {
      const points: { x: number; y: number }[] = [];
      const startX = target.x + (Math.random() - 0.5) * 60;
      const startY = 0;
      const steps = 6;
      for (let s = 0; s <= steps; s++) {
        const segT = s / steps;
        points.push({
          x: startX + (target.x - startX) * segT + (Math.random() - 0.5) * 32,
          y: startY + (target.y - startY) * segT,
        });
      }
      this.thunderVisuals.push({
        x: target.x,
        y: target.y,
        points,
        life: 0.28,
      });

      const { damage, isCrit } = calculateDamage(
        this.playerStats.attackDamage * 1.85,
        this.playerStats.critRate,
        this.playerStats.critMultiplier
      );
      this.damageEnemy(target, damage, isCrit, target.x, target.y);
      this.spawnBloodExplosion(target.x, target.y, '#38bdf8', 14);
    }
  }

  private damageEnemy(enemy: Enemy, amount: number, isCrit: boolean, hitX: number, hitY: number) {
    const isGolem = enemy.type === 'golem';
    const effectiveDmg = isGolem ? amount * 0.65 : amount;
    const finalDmg = Math.max(1, Math.round(effectiveDmg));
    enemy.hp -= finalDmg;
    enemy.hitFlash = 0.08;
    this.totalDamageDealt += finalDmg;

    const kdx = enemy.x - this.playerX;
    const kdy = enemy.y - this.playerY;
    const kdist = Math.hypot(kdx, kdy) || 1;
    // Golems have high knockback resistance
    const knockbackFactor = isGolem ? 35 : 95;
    enemy.vx += (kdx / kdist) * knockbackFactor;
    enemy.vy += (kdy / kdist) * knockbackFactor;

    if (isCrit || finalDmg > 40) {
      this.hitstopTimer = 0.04;
      this.cameraTrauma = Math.min(0.65, this.cameraTrauma + 0.16);
    }

    this.spawnFloatingText(
      enemy.x + (Math.random() - 0.5) * 16,
      enemy.y - 14,
      isCrit ? `⚡CRIT! ${finalDmg}` : `${finalDmg}`,
      isCrit ? '#facc15' : '#ffffff',
      isCrit ? 1.45 : 1.05
    );
  }

  private hurtPlayer(dmg: number) {
    sound.playPlayerHurt();
    const reduced = Math.max(1, Math.round(dmg * (1 - this.playerStats.damageReduction)));
    this.playerStats.hp -= reduced;
    this.invulnerabilityTimer = 0.75;
    this.cameraTrauma = Math.min(1.0, this.cameraTrauma + 0.5);

    this.spawnFloatingText(this.playerX, this.playerY - 24, `-${reduced}`, '#ef4444', 1.25);

    if (this.playerStats.hp <= 0) {
      this.playerStats.hp = 0;
      this.state = 'gameover';
      document.body.dataset.state = 'gameover';
      sound.playGameOver();
      const stage = this.getCurrentStage();
      const totalTime = stage.survivalTime || 60.0;
      this.onGameOverPrompt?.({
        survivedTime: totalTime - this.gameTimer,
        kills: this.kills,
        level: this.level,
        damageDealt: this.totalDamageDealt,
        gemsCollected: this.gemsCollected,
        revivedCount: this.revivedCount,
      });
    }
  }

  private collectXp(amount: number) {
    this.xp += amount;
    if (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded;
      this.level += 1;
      this.xpNeeded = getXpForLevel(this.level);
      sound.playLevelUp();

      this.state = 'level_up';
      document.body.dataset.state = 'paused';
      const perks = rollThreePerks(this.acquiredPerks, false, this.config.perks);
      this.onLevelUpPrompt?.(perks);
    }
  }

  private spawnEnemy(allowedTypes: EnemyType[]) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    const offset = 45;

    switch (side) {
      case 0:
        x = Math.random() * w;
        y = -offset;
        break;
      case 1:
        x = w + offset;
        y = Math.random() * h;
        break;
      case 2:
        x = Math.random() * w;
        y = h + offset;
        break;
      case 3:
        x = -offset;
        y = Math.random() * h;
        break;
    }

    const stage = this.getCurrentStage();
    // Dynamically filter enemies from custom config based on allowed types & stage allowed IDs
    const availableConfigs = this.config.enemies.filter(
      (e) =>
        e.enabled &&
        allowedTypes.includes(e.type) &&
        (!stage.allowedEnemyIds || stage.allowedEnemyIds.length === 0 || stage.allowedEnemyIds.includes(e.id))
    );

    const chosenCfg =
      availableConfigs.length > 0
        ? availableConfigs[Math.floor(Math.random() * availableConfigs.length)]
        : (this.config.enemies.find((e) => e.enabled) || this.config.enemies[0]);

    this.enemies.push({
      id: this.nextEnemyId++,
      x,
      y,
      hp: chosenCfg.hp,
      maxHp: chosenCfg.hp,
      speed: chosenCfg.speed,
      radius: chosenCfg.radius,
      type: chosenCfg.type,
      color: chosenCfg.color,
      name: chosenCfg.name,
      emoji: chosenCfg.emoji,
      customImageUrl: chosenCfg.customImageUrl,
      spriteId: chosenCfg.spriteId,
      damage: chosenCfg.damage,
      exp: chosenCfg.exp,
      hitFlash: 0,
      vx: 0,
      vy: 0,
      wobble: Math.random() * Math.PI,
    });
  }

  private spawnGem(x: number, y: number, value: number) {
    let color = '#38bdf8';
    let radius = 6;
    if (value >= 18) {
      color = '#eab308';
      radius = 9;
    } else if (value >= 6) {
      color = '#a855f7';
      radius = 7.5;
    } else if (value >= 3) {
      color = '#22c55e';
      radius = 6.5;
    }

    this.gems.push({
      id: this.nextGemId++,
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 16,
      value,
      color,
      radius,
      vx: 0,
      vy: 0,
      beingAttracted: false,
    });
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string, scale: number = 1.0) {
    this.floatingTexts.push({
      id: this.nextTextId++,
      x,
      y,
      text,
      color,
      scale,
      alpha: 1.0,
      vy: -55,
      life: 0.85,
    });
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    maxLife: number,
    type: 'spark' | 'sakura' | 'ember' | 'stardust' | 'snow' = 'spark'
  ) {
    const p = this.particlePool[this.particleIndex];
    this.particleIndex = (this.particleIndex + 1) % this.particlePool.length;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.color = color;
    p.alpha = 1;
    p.life = 0;
    p.maxLife = maxLife;
    p.type = type;
    p.rotation = Math.random() * Math.PI * 2;
    p.vRot = (Math.random() - 0.5) * 4;
  }

  private spawnAmbientParticle(w: number, h: number, randomY: boolean) {
    const stage = this.getCurrentStage();
    const type = stage.ambientParticle || 'sakura';
    const x = Math.random() * (w + 60) - 30;
    const y = randomY ? Math.random() * h : -15;

    let vx = 20 + Math.random() * 35;
    let vy = 35 + Math.random() * 45;
    let color = 'rgba(244, 114, 182, 0.75)'; // Sakura pink

    if (type === 'ember') {
      vx = (Math.random() - 0.5) * 30;
      vy = -(30 + Math.random() * 40);
      color = 'rgba(249, 115, 22, 0.85)';
    } else if (type === 'stardust') {
      vx = (Math.random() - 0.5) * 20;
      vy = 20 + Math.random() * 25;
      color = 'rgba(56, 189, 248, 0.8)';
    } else if (type === 'snow') {
      vx = (Math.random() - 0.5) * 15;
      vy = 25 + Math.random() * 30;
      color = 'rgba(255, 255, 255, 0.85)';
    }

    this.spawnParticle(x, y, vx, vy, 4 + Math.random() * 3, color, 6.0, type);
  }

  private spawnBloodExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 130;
      this.spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        2.5 + Math.random() * 3,
        color,
        0.35 + Math.random() * 0.25,
        'spark'
      );
    }
  }

  // RENDER PIPELINE
  private render() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.ctx.save();

    if (this.cameraTrauma > 0) {
      const shakeMag = this.cameraTrauma * this.cameraTrauma * 16;
      const ox = (Math.random() - 0.5) * shakeMag;
      const oy = (Math.random() - 0.5) * shakeMag;
      this.ctx.translate(ox, oy);
    }

    const stage = this.getCurrentStage();
    const hero = this.getCurrentHeroClass();

    // 1. Illustrated Japanese Anime Background
    if (this.isBgLoaded && this.bgImage) {
      const bgOffsetX = -((this.playerX - w / 2) * 0.08);
      const bgOffsetY = -((this.playerY - h / 2) * 0.08);
      this.ctx.drawImage(this.bgImage, bgOffsetX - 20, bgOffsetY - 20, w + 40, h + 40);

      const totalTime = stage.survivalTime || 60;
      const elapsed = totalTime - this.gameTimer;
      const bossTime = stage.bossWaveTime || Math.floor(totalTime * 0.83);

      if (elapsed >= bossTime) {
        this.ctx.fillStyle = 'rgba(185, 28, 28, 0.22)';
        this.ctx.fillRect(0, 0, w, h);
      } else {
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
        this.ctx.fillRect(0, 0, w, h);
      }
    } else {
      const grad = this.ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, w, h);
    }

    // 2. Magic Circle
    this.ctx.save();
    this.ctx.translate(w / 2, h / 2);
    this.ctx.rotate(this.magicCircleRotation);

    const circleR = Math.min(w, h) * 0.38;
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.26)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, circleR, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, circleR * 0.72, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.2)';
    this.ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const x1 = Math.cos(a) * circleR;
      const y1 = Math.sin(a) * circleR;
      const x2 = Math.cos(a + Math.PI * 0.75) * circleR;
      const y2 = Math.sin(a + Math.PI * 0.75) * circleR;
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
    }
    this.ctx.stroke();
    this.ctx.restore();

    // 3. Render XP Gems
    for (const g of this.gems) {
      this.ctx.save();
      this.ctx.fillStyle = g.color;
      this.ctx.shadowColor = g.color;
      this.ctx.shadowBlur = 10;

      this.ctx.beginPath();
      this.ctx.moveTo(g.x, g.y - g.radius);
      this.ctx.lineTo(g.x + g.radius * 0.8, g.y);
      this.ctx.lineTo(g.x, g.y + g.radius);
      this.ctx.lineTo(g.x - g.radius * 0.8, g.y);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(g.x - 1.5, g.y - 1.5, 3, 3);
      this.ctx.restore();
    }

    // 4. Render Enemies
    for (const e of this.enemies) {
      this.ctx.save();
      this.ctx.translate(e.x, e.y);

      if (e.hitFlash > 0) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, e.radius * 0.85, e.radius * 0.9, e.radius * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Render enemy with Sprite Library and animations
        const customImg = e.customImageUrl ? this.enemyImageCache.get(e.customImageUrl) : null;
        const enemySprite = getSpriteById(this.config.sprites, e.spriteId);

        renderSpriteInCanvas(
          this.ctx,
          enemySprite,
          0,
          0,
          e.radius * 2.3,
          e.vx < 0 ? 'left' : 'right',
          e.wobble,
          true,
          e.type === 'boss' || e.type === 'elite',
          e.color,
          customImg
        );

        // Monster HP Bar
        if (e.hp < e.maxHp || e.type === 'elite' || e.type === 'boss') {
          const barW = e.radius * 2.2;
          const barH = e.type === 'boss' ? 5 : 3.5;
          const hpPct = Math.max(0, e.hp / e.maxHp);

          this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          this.ctx.fillRect(-barW / 2, -e.radius - 10, barW, barH);
          this.ctx.fillStyle = e.type === 'boss' ? '#ef4444' : '#22c55e';
          this.ctx.fillRect(-barW / 2, -e.radius - 10, barW * hpPct, barH);

          if (e.type === 'boss') {
            this.ctx.strokeStyle = '#facc15';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(-barW / 2, -e.radius - 10, barW, barH);
          }
        }
      }
      this.ctx.restore();
    }

    // 5. Render Projectiles
    for (const p of this.projectiles) {
      this.ctx.save();
      if (p.type === 'dagger') {
        const angle = Math.atan2(p.vy, p.vx);
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(angle);

        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 14;
        this.ctx.fillStyle = '#67e8f9';
        this.ctx.beginPath();
        this.ctx.moveTo(14, 0);
        this.ctx.lineTo(-8, -5);
        this.ctx.lineTo(-4, 0);
        this.ctx.lineTo(-8, 5);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-3, -1.2, 12, 2.4);
      } else if (p.type === 'lich_soul') {
        this.ctx.fillStyle = '#c084fc';
        this.ctx.shadowColor = '#a855f7';
        this.ctx.shadowBlur = 14;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#3b0764';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'spider_spit') {
        this.ctx.fillStyle = '#4ade80';
        this.ctx.shadowColor = '#22c55e';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#14532d';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'fox_fire') {
        this.ctx.fillStyle = '#f472b6';
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 16;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // enemy_arrow
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 6. Render Orbiters
    for (let i = 0; i < this.orbiters.length; i++) {
      const orb = this.orbiters[i];
      const angle = this.orbiterBaseAngle + (Math.PI * 2 * i) / this.orbiters.length;
      const ox = this.playerX + Math.cos(angle) * orb.radius;
      const oy = this.playerY + Math.sin(angle) * orb.radius;

      this.ctx.save();
      this.ctx.translate(ox, oy);
      this.ctx.rotate(angle + Math.PI / 2);

      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.font = '22px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = '#facc15';
      this.ctx.shadowBlur = 14;
      this.ctx.fillText('📖', 0, 0);
      this.ctx.restore();
    }

    // 7. Render Thunderstorm
    for (let i = this.thunderVisuals.length - 1; i >= 0; i--) {
      const tv = this.thunderVisuals[i];
      tv.life -= 0.016;
      if (tv.life <= 0) {
        this.thunderVisuals.splice(i, 1);
        continue;
      }
      this.ctx.save();
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 3.5;
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 18;
      this.ctx.beginPath();
      for (let pIdx = 0; pIdx < tv.points.length; pIdx++) {
        const pt = tv.points[pIdx];
        if (pIdx === 0) this.ctx.moveTo(pt.x, pt.y);
        else this.ctx.lineTo(pt.x, pt.y);
      }
      this.ctx.stroke();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.8;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 8. Render Player using 4-Directional HeroSpriteRenderer!
    this.ctx.save();
    // Shinto Magic Circle under feet
    this.ctx.save();
    this.ctx.translate(this.playerX, this.playerY + 14);
    this.ctx.rotate(this.magicCircleRotation * 1.5);
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();

    // Invulnerability Golden Shield
    if (this.invulnerabilityTimer > 0) {
      this.ctx.save();
      this.ctx.translate(this.playerX, this.playerY);
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = '#facc15';
      this.ctx.shadowBlur = 16;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 28, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw the 4-Direction animated hero sprite with selected class & custom sprite!
    const heroSpriteConfig = getSpriteById(this.config.sprites, hero.spriteId);
    heroSprite.draw(
      this.ctx,
      this.playerX,
      this.playerY,
      this.playerDirection,
      this.playerWalkCycle,
      this.isMoving,
      44,
      heroSpriteConfig,
      this.config.sprites,
      this.isPromoted,
      hero.promotion?.auraColor || '#facc15'
    );
    this.ctx.restore();

    // 9. Nuke Shockwave
    if (this.nukeShockwave && this.nukeShockwave.active) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(253, 224, 71, 0.95)';
      this.ctx.lineWidth = 10;
      this.ctx.shadowColor = '#facc15';
      this.ctx.shadowBlur = 28;
      this.ctx.beginPath();
      this.ctx.arc(this.nukeShockwave.x, this.nukeShockwave.y, this.nukeShockwave.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 10. Particles
    for (const p of this.particlePool) {
      if (!p.active) continue;
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;

      if (p.type === 'sakura') {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation || 0);
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'ember') {
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = '#f97316';
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'stardust' || p.type === 'snow') {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 11. Floating Damage Numbers
    for (const ft of this.floatingTexts) {
      this.ctx.save();
      this.ctx.globalAlpha = ft.alpha;
      this.ctx.font = `900 ${Math.round(15 * ft.scale)}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = ft.color;
      this.ctx.strokeStyle = '#1e1b4b';
      this.ctx.lineWidth = 3.5;
      this.ctx.strokeText(ft.text, ft.x, ft.y);
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    }

    // 12. Virtual Joystick Indicator
    if (this.touchActive && this.state === 'playing') {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.arc(this.touchOriginX, this.touchOriginY, 48, 0, Math.PI * 2);
      this.ctx.stroke();

      const dragDx = this.touchCurrentX - this.touchOriginX;
      const dragDy = this.touchCurrentY - this.touchOriginY;
      const dragDist = Math.hypot(dragDx, dragDy);
      const clampedDist = Math.min(48, dragDist);
      const thumbX = this.touchOriginX + (dragDist > 0 ? (dragDx / dragDist) * clampedDist : 0);
      const thumbY = this.touchOriginY + (dragDist > 0 ? (dragDy / dragDist) * clampedDist : 0);

      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 14;
      this.ctx.beginPath();
      this.ctx.arc(thumbX, thumbY, 20, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  public destroy() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
