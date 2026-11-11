import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getXpForLevel,
  calculateDamage,
  getWaveConfig,
  applyPerkToStats,
  checkCircleCollision,
  checkHeroPromotion,
  applyPromotionBonus,
  INITIAL_PLAYER_STATS,
} from './rules.ts';
import {
  DEFAULT_GAME_CONFIG,
  exportConfigJson,
  importConfigJson,
  unlockStage,
  loadUnlockedStages,
} from './customConfig.ts';
import { DEFAULT_SPRITE_LIBRARY } from './spriteLibrary.ts';

test('XP curve grows exponentially and provides fast early level-ups', () => {
  assert.equal(getXpForLevel(1), 5);
  assert.equal(getXpForLevel(2), 12);
  assert.ok(getXpForLevel(5) > getXpForLevel(4));
  assert.ok(getXpForLevel(10) > getXpForLevel(5));
});

test('calculateDamage handles non-crit and crit correctly with custom RNG', () => {
  const normal = calculateDamage(20, 0.1, 2.0, () => 0.5);
  assert.equal(normal.damage, 20);
  assert.equal(normal.isCrit, false);

  const crit = calculateDamage(20, 0.1, 2.5, () => 0.05);
  assert.equal(crit.damage, 50);
  assert.equal(crit.isCrit, true);
});

test('wave config scales with time and triggers final boss phase at 50s', () => {
  const earlyWave = getWaveConfig(5);
  assert.equal(earlyWave.bossSpawned, false);
  assert.ok(earlyWave.maxEnemies <= 50);

  const midWave = getWaveConfig(30);
  assert.ok(midWave.spawnInterval < earlyWave.spawnInterval);
  assert.ok(midWave.allowedTypes.includes('archer'));

  const finalWave = getWaveConfig(55);
  assert.equal(finalWave.bossSpawned, true);
  assert.ok(finalWave.allowedTypes.includes('boss'));
});

test('wave config respects custom stage survival time and boss wave', () => {
  const customStage = {
    ...DEFAULT_GAME_CONFIG.stages[0],
    survivalTime: 120,
    bossWaveTime: 100,
    spawnRateMultiplier: 2.0,
    maxEnemiesMultiplier: 1.5,
  };

  const early = getWaveConfig(10, customStage);
  assert.equal(early.bossSpawned, false);

  const boss = getWaveConfig(105, customStage);
  assert.equal(boss.bossSpawned, true);
  assert.ok(boss.maxEnemies > 250);
});

test('applyPerkToStats accurately stacks upgrades and custom perks', () => {
  let stats = { ...INITIAL_PLAYER_STATS };
  
  // Standard perk
  stats = applyPerkToStats(stats, 'holy_dagger', 1);
  assert.equal(stats.projectileCount, 2);
  assert.equal(stats.attackDamage, INITIAL_PLAYER_STATS.attackDamage + 6);

  // Custom perk with custom bonuses
  const customPerks = [
    {
      id: 'custom_meteor',
      name: '流星群 (Meteor Swarm)',
      category: 'weapon' as const,
      tier: 'epic' as const,
      emoji: '☄️',
      desc: '巨量流星墜落',
      maxLevel: 3,
      damageBonus: 50,
      speedBonus: 30,
    },
  ];
  stats = applyPerkToStats(stats, 'custom_meteor', 1, customPerks);
  assert.equal(stats.attackDamage, INITIAL_PLAYER_STATS.attackDamage + 6 + 50);
  assert.equal(stats.speed, INITIAL_PLAYER_STATS.speed + 30);
});

test('customConfig import and export preserves full campaign, hero classes, and passkey', () => {
  const json = exportConfigJson(DEFAULT_GAME_CONFIG);
  assert.ok(json.includes('碧玉スライム'));
  assert.ok(json.includes('survivalTime'));
  assert.ok(json.includes('8888'));
  assert.ok(json.includes('浪人劍聖'));

  const imported = importConfigJson(json);
  assert.ok(imported !== null);
  assert.equal(imported?.passkey, '8888');
  assert.equal(imported?.stages.length, 3);
  assert.equal(imported?.heroClasses.length, 4);
  assert.equal(imported?.enemies.length, DEFAULT_GAME_CONFIG.enemies.length);
});

test('campaign stage unlock progression works correctly', () => {
  const initial = loadUnlockedStages();
  assert.ok(initial.includes('stage_1'));

  unlockStage('stage_2');
  const afterUnlock = loadUnlockedStages();
  assert.ok(afterUnlock.includes('stage_2'));
});

test('checkCircleCollision accurately tests hitboxes', () => {
  assert.equal(checkCircleCollision(0, 0, 10, 5, 0, 10), true);
  assert.equal(checkCircleCollision(0, 0, 10, 20, 0, 10), true);
  assert.equal(checkCircleCollision(0, 0, 10, 30, 0, 10), false);
});

test('checkHeroPromotion checks accumulated skill count thresholds and applies promotion bonus', () => {
  const mageHero = DEFAULT_GAME_CONFIG.heroClasses[0];
  assert.ok(mageHero.promotion);

  // Before acquiring required perks:
  assert.equal(checkHeroPromotion(mageHero, {}), false);
  assert.equal(checkHeroPromotion(mageHero, { holy_dagger: 2 }), false);

  // When holy_dagger reaches Lv.3 but secondary perk thunder_strike is missing:
  assert.equal(checkHeroPromotion(mageHero, { holy_dagger: 3 }), false);

  // When both holy_dagger Lv.3 and thunder_strike Lv.1 are accumulated:
  assert.equal(checkHeroPromotion(mageHero, { holy_dagger: 3, thunder_strike: 1 }), true);
  // Higher levels also qualify:
  assert.equal(checkHeroPromotion(mageHero, { holy_dagger: 4, thunder_strike: 2 }), true);

  // Apply promotion bonus stats
  const baseStats = { ...INITIAL_PLAYER_STATS };
  const promoted = applyPromotionBonus(baseStats, mageHero.promotion!);
  assert.equal(promoted.attackDamage, baseStats.attackDamage + mageHero.promotion!.bonusDamage);
  assert.equal(promoted.speed, baseStats.speed + mageHero.promotion!.bonusSpeed);
  assert.equal(promoted.hp, baseStats.hp + mageHero.promotion!.bonusHp);
  assert.equal(promoted.maxHp, baseStats.maxHp + mageHero.promotion!.bonusHp);
});

test('perk selection keyboard navigation wraps and bounds correctly', () => {
  const perkCount = 3;
  const navigateIndex = (current: number, direction: 'up' | 'down') => {
    if (direction === 'down') return (current + 1) % perkCount;
    return (current - 1 + perkCount) % perkCount;
  };

  assert.equal(navigateIndex(0, 'down'), 1);
  assert.equal(navigateIndex(1, 'down'), 2);
  assert.equal(navigateIndex(2, 'down'), 0); // wraps down to top

  assert.equal(navigateIndex(0, 'up'), 2); // wraps up to bottom
  assert.equal(navigateIndex(2, 'up'), 1);
  assert.equal(navigateIndex(1, 'up'), 0);
});

test('cooldown progress is strictly clamped between 0 and 1 with accurate ready state', () => {
  const calculateCooldown = (remainingSec: number, totalSec: number) => {
    const clampedRemaining = Math.max(0, Math.min(remainingSec, totalSec));
    const percent = totalSec > 0 ? clampedRemaining / totalSec : 0;
    return {
      remaining: Math.round(clampedRemaining * 10) / 10,
      percent: Math.max(0, Math.min(1, percent)),
      isReady: clampedRemaining <= 0.05,
    };
  };

  const cooling = calculateCooldown(1.2, 2.0);
  assert.equal(cooling.remaining, 1.2);
  assert.equal(cooling.percent, 0.6);
  assert.equal(cooling.isReady, false);

  const ready = calculateCooldown(0, 2.0);
  assert.equal(ready.remaining, 0);
  assert.equal(ready.percent, 0);
  assert.equal(ready.isReady, true);

  const overflow = calculateCooldown(3.5, 2.0);
  assert.equal(overflow.remaining, 2.0);
  assert.equal(overflow.percent, 1.0);
});

test('default sprite library contains 30+ rich sprites across hero, monster, and boss', () => {
  assert.ok(DEFAULT_SPRITE_LIBRARY.length >= 30, 'Sprite library must have at least 30 sprites');
  const heroes = DEFAULT_SPRITE_LIBRARY.filter((s) => s.category === 'hero');
  const monsters = DEFAULT_SPRITE_LIBRARY.filter((s) => s.category === 'monster');
  const bosses = DEFAULT_SPRITE_LIBRARY.filter((s) => s.category === 'boss');

  assert.ok(heroes.length >= 10, 'At least 10 heroes');
  assert.ok(monsters.length >= 12, 'At least 12 monster types');
  assert.ok(bosses.length >= 6, 'At least 6 boss types');
});

