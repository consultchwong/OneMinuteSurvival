/**
 * Pure game rules, math, and progression logic
 * Decoupled from canvas and rendering for fast unit testing.
 */

import { StageConfig, PerkCustomConfig, HeroClass, HeroPromotionConfig, EnemyType } from './customConfig';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  speed: number;
  attackDamage: number;
  attackSpeed: number; // multiplier
  attackRange: number;
  critRate: number; // 0.0 - 1.0
  critMultiplier: number;
  projectileCount: number;
  pierce: number;
  orbitersCount: number;
  thunderCooldown: number;
  magnetRange: number;
  damageReduction: number;
}

export interface PerkDefinition {
  id: string;
  name: string;
  category: 'weapon' | 'passive';
  tier: 'common' | 'rare' | 'epic';
  emoji: string;
  desc: string;
  maxLevel: number;
}

export const INITIAL_PLAYER_STATS: PlayerStats = {
  hp: 100,
  maxHp: 100,
  speed: 160,
  attackDamage: 25,
  attackSpeed: 1.0,
  attackRange: 280,
  critRate: 0.1,
  critMultiplier: 2.0,
  projectileCount: 1,
  pierce: 1,
  orbitersCount: 0,
  thunderCooldown: 3.5, // strikes every 3.5s
  magnetRange: 90,
  damageReduction: 0,
};

/**
 * Calculates XP needed to reach next level.
 * Level 1 -> 2: 5 XP (fast early dopamine)
 * Smooth exponential progression suited for micro-runs.
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 5;
  if (level <= 3) return 8 + (level - 1) * 4;
  return Math.floor(15 * Math.pow(1.22, level - 3));
}

/**
 * Calculates damage with critical hit chance
 */
export function calculateDamage(
  baseDmg: number,
  critRate: number,
  critMultiplier: number,
  rng: () => number = Math.random
): { damage: number; isCrit: boolean } {
  const isCrit = rng() < critRate;
  const dmg = isCrit ? baseDmg * critMultiplier : baseDmg;
  return {
    damage: Math.round(dmg),
    isCrit,
  };
}

/**
 * Determines enemy spawn parameters based on run elapsed time and stage config
 */
export function getWaveConfig(
  elapsedSec: number,
  stageConfig?: StageConfig
): {
  spawnInterval: number; // seconds per mob spawn
  maxEnemies: number;
  allowedTypes: EnemyType[];
  bossSpawned: boolean;
} {
  const totalTime = stageConfig?.survivalTime || 60;
  const bossTime = stageConfig?.bossWaveTime || Math.floor(totalTime * 0.83);
  const spawnMult = stageConfig?.spawnRateMultiplier || 1.0;
  const maxMult = stageConfig?.maxEnemiesMultiplier || 1.0;

  const progress = Math.min(1.0, Math.max(0, elapsedSec / totalTime));
  const isBossPhase = elapsedSec >= bossTime;

  if (isBossPhase) {
    return {
      spawnInterval: Math.max(0.08, (0.12 / spawnMult)),
      maxEnemies: Math.round(220 * maxMult),
      allowedTypes: ['swarmer', 'chaser', 'dasher', 'archer', 'spider', 'ghost', 'flame_spirit', 'golem', 'lich', 'elite', 'boss', 'nine_tails'],
      bossSpawned: true,
    };
  }

  if (progress < 0.2) {
    // Phase 1: Warmup
    return {
      spawnInterval: Math.max(0.15, (0.45 / spawnMult)),
      maxEnemies: Math.round(40 * maxMult),
      allowedTypes: ['swarmer', 'chaser', 'spider'],
      bossSpawned: false,
    };
  } else if (progress < 0.45) {
    // Phase 2: Bats & Dashers & Ghost
    return {
      spawnInterval: Math.max(0.12, (0.32 / spawnMult)),
      maxEnemies: Math.round(75 * maxMult),
      allowedTypes: ['swarmer', 'chaser', 'dasher', 'spider', 'ghost'],
      bossSpawned: false,
    };
  } else if (progress < 0.75) {
    // Phase 3: Archers & Horde & Flame spirit
    return {
      spawnInterval: Math.max(0.1, (0.22 / spawnMult)),
      maxEnemies: Math.round(120 * maxMult),
      allowedTypes: ['swarmer', 'chaser', 'dasher', 'archer', 'flame_spirit', 'spider', 'ghost'],
      bossSpawned: false,
    };
  } else {
    // Phase 4: Elite Oni & Golem & Lich Rush
    return {
      spawnInterval: Math.max(0.08, (0.16 / spawnMult)),
      maxEnemies: Math.round(160 * maxMult),
      allowedTypes: ['swarmer', 'chaser', 'dasher', 'archer', 'elite', 'golem', 'lich', 'ghost', 'flame_spirit'],
      bossSpawned: false,
    };
  }
}

/**
 * Applies a chosen perk to player stats, supporting custom perk effect bonuses
 */
export function applyPerkToStats(
  stats: PlayerStats,
  perkId: string,
  currentLevel: number,
  customPerks?: PerkCustomConfig[]
): PlayerStats {
  const updated = { ...stats };

  // If custom perk config is provided, check for custom bonuses
  const customPerk = customPerks?.find((p) => p.id === perkId);
  if (customPerk) {
    if (customPerk.damageBonus) updated.attackDamage += customPerk.damageBonus;
    if (customPerk.projCountBonus) updated.projectileCount += customPerk.projCountBonus;
    if (customPerk.orbitersBonus) updated.orbitersCount = Math.min(8, updated.orbitersCount + customPerk.orbitersBonus);
    if (customPerk.speedBonus) updated.speed += customPerk.speedBonus;
    if (customPerk.hpBonus) {
      updated.maxHp += customPerk.hpBonus;
      updated.hp = Math.min(updated.maxHp, updated.hp + customPerk.hpBonus);
    }
    if (customPerk.magnetBonus) updated.magnetRange += customPerk.magnetBonus;
    if (customPerk.critBonus) {
      updated.critRate = Math.min(0.9, updated.critRate + customPerk.critBonus);
      updated.critMultiplier += customPerk.critBonus * 2;
    }
    if (customPerk.cooldownReduction) {
      updated.thunderCooldown = Math.max(0.6, updated.thunderCooldown - customPerk.cooldownReduction);
    }
    if (customPerk.armorBonus) {
      updated.damageReduction = Math.min(0.6, updated.damageReduction + customPerk.armorBonus);
    }
    return updated;
  }

  // Standard fallback
  switch (perkId) {
    case 'holy_dagger':
      updated.projectileCount += 1;
      updated.attackDamage += 6;
      break;
    case 'orbital_bible':
      updated.orbitersCount = Math.min(6, updated.orbitersCount + 1);
      break;
    case 'thunder_strike':
      updated.thunderCooldown = Math.max(0.8, updated.thunderCooldown - 0.6);
      break;
    case 'swift_boots':
      updated.speed += 25;
      break;
    case 'giant_cleave':
      updated.attackDamage += 12;
      updated.pierce += 1;
      break;
    case 'vitality_ring':
      updated.maxHp += 30;
      updated.hp = Math.min(updated.maxHp, updated.hp + 40);
      break;
    case 'super_magnet':
      updated.magnetRange += 60;
      break;
    case 'crit_frenzy':
      updated.critRate = Math.min(0.8, updated.critRate + 0.15);
      updated.critMultiplier += 0.4;
      break;
    case 'rapid_wand':
      updated.attackSpeed += 0.25;
      break;
    case 'iron_armor':
      updated.damageReduction = Math.min(0.5, updated.damageReduction + 0.12);
      break;
    default:
      updated.attackDamage += 5;
      break;
  }

  return updated;
}

/**
 * Pure circle collision helper
 */
export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distSq = dx * dx + dy * dy;
  const radSum = r1 + r2;
  return distSq <= radSum * radSum;
}

/**
 * Checks if the player has collected sufficient perks to trigger Class Promotion / 轉職
 */
export function checkHeroPromotion(
  hero: HeroClass,
  acquiredPerks: Record<string, number>
): boolean {
  if (!hero.promotion) return false;
  const primaryLvl = acquiredPerks[hero.promotion.requiredPerkId] || 0;
  if (primaryLvl < hero.promotion.requiredPerkLevel) {
    return false;
  }
  if (hero.promotion.secondaryPerkId) {
    const secLvl = acquiredPerks[hero.promotion.secondaryPerkId] || 0;
    const reqSecLvl = hero.promotion.secondaryPerkLevel || 1;
    if (secLvl < reqSecLvl) {
      return false;
    }
  }
  return true;
}

/**
 * Applies permanent promotion stat bonuses upon class evolution
 */
export function applyPromotionBonus(
  stats: PlayerStats,
  promo: HeroPromotionConfig
): PlayerStats {
  const updated = { ...stats };
  updated.attackDamage += promo.bonusDamage || 0;
  updated.speed += promo.bonusSpeed || 0;
  updated.maxHp += promo.bonusHp || 0;
  updated.hp = Math.min(updated.maxHp, updated.hp + (promo.bonusHp || 0));
  updated.projectileCount += 1;
  updated.critRate = Math.min(0.95, updated.critRate + 0.1);
  return updated;
}
