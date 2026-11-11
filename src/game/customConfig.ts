/**
 * Game Configuration & Customization Schema for Design Studio (設計模式)
 * Supports dynamic Enemies/Bosses, multiple Hero Classes, Passkey security, and Multi-Stage Campaign Progression.
 */

import {
  SpriteAssetConfig,
  DEFAULT_SPRITE_LIBRARY,
  getSpriteById,
} from './spriteLibrary';

export interface CampaignStage {
  id: string;
  stageNumber: number;
  title: string;
  subtitle: string;
  survivalTime: number; // in seconds
  bossWaveTime: number; // in seconds
  backgroundPreset: 'sakura_shrine' | 'crystal_forest' | 'volcano_ruins' | 'custom';
  customBackgroundUrl: string;
  ambientParticle: 'sakura' | 'ember' | 'stardust' | 'snow';
  spawnRateMultiplier: number;
  maxEnemiesMultiplier: number;
  allowedEnemyIds: string[]; // which enemies appear in this stage
}

export type StageConfig = CampaignStage;

export interface HeroPromotionConfig {
  promotedName: string;
  promotedTitle: string;
  promotedEmoji: string;
  requiredPerkId: string;
  requiredPerkLevel: number;
  secondaryPerkId?: string;
  secondaryPerkLevel?: number;
  bonusDamage: number;
  bonusSpeed: number;
  bonusHp: number;
  auraColor: string;
  description: string;
}

export interface HeroClass {
  id: string;
  name: string;
  title: string;
  category: 'mage' | 'ronin' | 'ranger' | 'paladin' | 'custom';
  emoji: string;
  avatarUrl: string;
  spriteId?: string;
  desc: string;
  initialHp: number;
  initialSpeed: number;
  baseDamage: number;
  attackSpeed: number;
  magnetRange: number;
  critRate: number;
  critMultiplier: number;
  damageReduction: number;
  initialWeapon: 'holy_dagger' | 'giant_cleave' | 'orbital_bible' | 'rapid_wand';
  promotion?: HeroPromotionConfig;
}

export type EnemyType =
  | 'swarmer'
  | 'dasher'
  | 'archer'
  | 'chaser'
  | 'elite'
  | 'boss'
  | 'golem'
  | 'lich'
  | 'spider'
  | 'ghost'
  | 'flame_spirit'
  | 'nine_tails';

export interface EnemyCustomConfig {
  id: string;
  name: string;
  type: EnemyType;
  emoji: string;
  customImageUrl: string;
  spriteId?: string;
  color: string;
  hp: number;
  speed: number;
  radius: number;
  damage: number;
  exp: number;
  enabled: boolean;
  shootInterval?: number;
}

export interface PerkCustomConfig {
  id: string;
  name: string;
  category: 'weapon' | 'passive';
  tier: 'common' | 'rare' | 'epic';
  emoji: string;
  desc: string;
  maxLevel: number;
  damageBonus?: number;
  projCountBonus?: number;
  orbitersBonus?: number;
  speedBonus?: number;
  hpBonus?: number;
  magnetBonus?: number;
  critBonus?: number;
  cooldownReduction?: number;
  armorBonus?: number;
}

export interface GameConfig {
  passkey: string;
  currentStageId: string;
  selectedHeroClassId: string;
  stages: CampaignStage[];
  heroClasses: HeroClass[];
  enemies: EnemyCustomConfig[];
  perks: PerkCustomConfig[];
  sprites: SpriteAssetConfig[];
}

export {
  type SpriteAssetConfig,
  DEFAULT_SPRITE_LIBRARY,
  getSpriteById,
};

export const PRESET_BACKGROUND_IMAGES: Record<string, string> = {
  sakura_shrine: '/src/assets/images/anime_battle_ground_1794060378258.jpg',
  crystal_forest: '/src/assets/images/anime_crystal_forest_1794185694573.jpg',
  volcano_ruins: '/src/assets/images/anime_volcanic_ruins_1794185695254.jpg',
};

export const DEFAULT_CAMPAIGN_STAGES: CampaignStage[] = [
  {
    id: 'stage_1',
    stageNumber: 1,
    title: '第一關：櫻花妖神社 (Sakura Shrine)',
    subtitle: '初入異界 · 妖魔試煉',
    survivalTime: 45,
    bossWaveTime: 35,
    backgroundPreset: 'sakura_shrine',
    customBackgroundUrl: '',
    ambientParticle: 'sakura',
    spawnRateMultiplier: 1.0,
    maxEnemiesMultiplier: 1.0,
    allowedEnemyIds: ['swarmer', 'dasher', 'elite'],
  },
  {
    id: 'stage_2',
    stageNumber: 2,
    title: '第二關：幽夜紫晶深林 (Crystal Forest)',
    subtitle: '魔晶暴動 · 弓手與暗夜妖魔',
    survivalTime: 60,
    bossWaveTime: 50,
    backgroundPreset: 'crystal_forest',
    customBackgroundUrl: '',
    ambientParticle: 'stardust',
    spawnRateMultiplier: 1.25,
    maxEnemiesMultiplier: 1.2,
    allowedEnemyIds: ['swarmer', 'dasher', 'archer', 'chaser', 'spider', 'ghost', 'flame_spirit', 'elite'],
  },
  {
    id: 'stage_3',
    stageNumber: 3,
    title: '第三關：灼熱煉獄黑曜堡 (Volcanic Citadel)',
    subtitle: '終焉死守 · 極致深淵魔王親臨！',
    survivalTime: 75,
    bossWaveTime: 55,
    backgroundPreset: 'volcano_ruins',
    customBackgroundUrl: '',
    ambientParticle: 'ember',
    spawnRateMultiplier: 1.45,
    maxEnemiesMultiplier: 1.4,
    allowedEnemyIds: ['swarmer', 'dasher', 'archer', 'chaser', 'golem', 'lich', 'spider', 'ghost', 'flame_spirit', 'elite', 'boss', 'nine_tails'],
  },
];

export const DEFAULT_HERO_CLASSES: HeroClass[] = [
  {
    id: 'mage',
    name: '大魔導士・アルス (Ars)',
    title: '【神撃法皇】範圍魔術・高魔力',
    category: 'mage',
    emoji: '🧙‍♂️',
    avatarUrl: '/src/assets/images/anime_hero_avatar_1794060378384.jpg',
    spriteId: 'hero_mage',
    desc: '擅長聖光飛劍與雷霆秘術，初始自帶追蹤飛劍，拾取半徑大。',
    initialHp: 100,
    initialSpeed: 160,
    baseDamage: 25,
    attackSpeed: 1.0,
    magnetRange: 95,
    critRate: 0.15,
    critMultiplier: 2.0,
    damageReduction: 0.0,
    initialWeapon: 'holy_dagger',
    promotion: {
      promotedName: '聖光神皇・アルス',
      promotedTitle: '【蒼穹聖皇】萬劍神裁・神聖爆炎',
      promotedEmoji: '✨🧙‍♂️',
      requiredPerkId: 'holy_dagger',
      requiredPerkLevel: 3,
      secondaryPerkId: 'thunder_strike',
      secondaryPerkLevel: 1,
      bonusDamage: 22,
      bonusSpeed: 25,
      bonusHp: 50,
      auraColor: '#38bdf8',
      description: '破邪靈劍 Lv.3 + 天雷招來 Lv.1 ➜ 覺醒【聖光神皇】！',
    },
  },
  {
    id: 'ronin',
    name: '浪人劍聖・レン (Ren)',
    title: '【疾風居合】超高攻速・極限暴擊',
    category: 'ronin',
    emoji: '🗡️',
    avatarUrl: '',
    spriteId: 'hero_ronin',
    desc: '無影無蹤的浪人武者，移速快、暴擊率極高，初始自帶巨靈斬擊。',
    initialHp: 90,
    initialSpeed: 190,
    baseDamage: 32,
    attackSpeed: 1.2,
    magnetRange: 80,
    critRate: 0.35,
    critMultiplier: 2.5,
    damageReduction: 0.0,
    initialWeapon: 'giant_cleave',
    promotion: {
      promotedName: '修羅劍帝・レン',
      promotedTitle: '【無雙居合】斬魔修羅・百裂居合',
      promotedEmoji: '⚡🗡️',
      requiredPerkId: 'giant_cleave',
      requiredPerkLevel: 3,
      secondaryPerkId: 'crit_frenzy',
      secondaryPerkLevel: 1,
      bonusDamage: 30,
      bonusSpeed: 35,
      bonusHp: 40,
      auraColor: '#ef4444',
      description: '巨靈斬擊 Lv.3 + 暴擊狂潮 Lv.1 ➜ 覺醒【修羅劍帝】！',
    },
  },
  {
    id: 'ranger',
    name: '精靈神射手・ライラ (Lyra)',
    title: '【森之箭神】超遠射程・多重連射',
    category: 'ranger',
    emoji: '🏹',
    avatarUrl: '',
    spriteId: 'hero_ranger',
    desc: '精靈之森的百步穿楊神射手，武器攻速極高，擅長放風箏割草。',
    initialHp: 85,
    initialSpeed: 175,
    baseDamage: 24,
    attackSpeed: 1.4,
    magnetRange: 110,
    critRate: 0.25,
    critMultiplier: 2.2,
    damageReduction: 0.0,
    initialWeapon: 'rapid_wand',
    promotion: {
      promotedName: '幻影神射・ライラ',
      promotedTitle: '【千翎風暴】超音速百步穿楊',
      promotedEmoji: '🌪️🏹',
      requiredPerkId: 'rapid_wand',
      requiredPerkLevel: 3,
      secondaryPerkId: 'swift_boots',
      secondaryPerkLevel: 1,
      bonusDamage: 20,
      bonusSpeed: 45,
      bonusHp: 40,
      auraColor: '#22c55e',
      description: '神速術杖 Lv.3 + 疾風天翔 Lv.1 ➜ 覺醒【幻影神射】！',
    },
  },
  {
    id: 'paladin',
    name: '聖殿騎士・ローランド (Roland)',
    title: '【不動金剛】超厚生命・堅壁反甲',
    category: 'paladin',
    emoji: '🛡️',
    avatarUrl: '',
    spriteId: 'hero_paladin',
    desc: '手持神聖大盾的聖殿騎士，防禦力驚人，初始自帶旋轉守護法典。',
    initialHp: 150,
    initialSpeed: 145,
    baseDamage: 26,
    attackSpeed: 0.95,
    magnetRange: 85,
    critRate: 0.1,
    critMultiplier: 1.8,
    damageReduction: 0.25,
    initialWeapon: 'orbital_bible',
    promotion: {
      promotedName: '聖域神將・ローランド',
      promotedTitle: '【不滅金剛】神聖聖殿・反擊聖裁',
      promotedEmoji: '⚜️🛡️',
      requiredPerkId: 'orbital_bible',
      requiredPerkLevel: 3,
      secondaryPerkId: 'iron_armor',
      secondaryPerkLevel: 1,
      bonusDamage: 25,
      bonusSpeed: 20,
      bonusHp: 120,
      auraColor: '#fbbf24',
      description: '禁斷法典 Lv.3 + 金剛靈甲 Lv.1 ➜ 覺醒【聖域神將】！',
    },
  },
];

export const DEFAULT_ENEMIES: EnemyCustomConfig[] = [
  {
    id: 'swarmer',
    name: '碧玉スライム (Slime)',
    type: 'swarmer',
    emoji: '🟢',
    customImageUrl: '',
    spriteId: 'mob_slime',
    color: '#22c55e',
    hp: 22,
    speed: 65,
    radius: 12,
    damage: 8,
    exp: 1,
    enabled: true,
  },
  {
    id: 'dasher',
    name: '疾風妖蝠 (Bat)',
    type: 'dasher',
    emoji: '🦇',
    customImageUrl: '',
    spriteId: 'mob_bat',
    color: '#06b6d4',
    hp: 18,
    speed: 130,
    radius: 11,
    damage: 7,
    exp: 2,
    enabled: true,
  },
  {
    id: 'archer',
    name: '骸骨弓手 (Skeleton Archer)',
    type: 'archer',
    emoji: '🏹',
    customImageUrl: '',
    spriteId: 'mob_archer',
    color: '#f97316',
    hp: 35,
    speed: 60,
    radius: 13,
    damage: 10,
    exp: 4,
    enabled: true,
    shootInterval: 2.2,
  },
  {
    id: 'chaser',
    name: '妖狐幻影 (Fox Spirit)',
    type: 'chaser',
    emoji: '🦊',
    customImageUrl: '',
    spriteId: 'mob_wolf',
    color: '#e11d48',
    hp: 50,
    speed: 82,
    radius: 14,
    damage: 12,
    exp: 3,
    enabled: true,
  },
  {
    id: 'spider',
    name: '毒瘴蛛魔 (Poison Spider)',
    type: 'spider',
    emoji: '🕷️',
    customImageUrl: '',
    spriteId: 'mob_spider',
    color: '#10b981',
    hp: 42,
    speed: 115,
    radius: 13,
    damage: 10,
    exp: 3,
    enabled: true,
  },
  {
    id: 'ghost',
    name: '幽冥女妖 (Banshee Ghost)',
    type: 'ghost',
    emoji: '👻',
    customImageUrl: '',
    spriteId: 'mob_ghost',
    color: '#94a3b8',
    hp: 65,
    speed: 76,
    radius: 15,
    damage: 13,
    exp: 5,
    enabled: true,
  },
  {
    id: 'flame_spirit',
    name: '烈焰火精靈 (Flame Imp)',
    type: 'flame_spirit',
    emoji: '👺',
    customImageUrl: '',
    spriteId: 'mob_imp',
    color: '#f97316',
    hp: 38,
    speed: 125,
    radius: 12,
    damage: 14,
    exp: 4,
    enabled: true,
  },
  {
    id: 'golem',
    name: '狂暴巨岩泰坦 (Rock Golem)',
    type: 'golem',
    emoji: '🗿',
    customImageUrl: '',
    spriteId: 'mob_golem',
    color: '#78716c',
    hp: 320,
    speed: 42,
    radius: 24,
    damage: 22,
    exp: 14,
    enabled: true,
  },
  {
    id: 'lich',
    name: '幽冥巫妖 (Necro Lich)',
    type: 'lich',
    emoji: '🔮',
    customImageUrl: '',
    spriteId: 'mob_lich',
    color: '#8b5cf6',
    hp: 125,
    speed: 54,
    radius: 18,
    damage: 16,
    exp: 9,
    enabled: true,
    shootInterval: 2.8,
  },
  {
    id: 'elite',
    name: '赤鬼武者 (Elite Oni)',
    type: 'elite',
    emoji: '👹',
    customImageUrl: '',
    spriteId: 'boss_oni',
    color: '#f59e0b',
    hp: 190,
    speed: 58,
    radius: 20,
    damage: 18,
    exp: 18,
    enabled: true,
  },
  {
    id: 'boss',
    name: '深淵魔王・極 (Abyss Demon Lord)',
    type: 'boss',
    emoji: '👿',
    customImageUrl: '/src/assets/images/anime_boss_avatar_1794060379219.jpg',
    spriteId: 'boss_demon',
    color: '#dc2626',
    hp: 920,
    speed: 46,
    radius: 32,
    damage: 26,
    exp: 60,
    enabled: true,
  },
  {
    id: 'nine_tails',
    name: '絕代九尾狐女王 (Nine-Tailed Fox Empress)',
    type: 'nine_tails',
    emoji: '🦊',
    customImageUrl: '',
    spriteId: 'boss_nine_tails',
    color: '#e11d48',
    hp: 1350,
    speed: 52,
    radius: 36,
    damage: 32,
    exp: 95,
    enabled: true,
    shootInterval: 3.0,
  },
];

export const DEFAULT_PERKS: PerkCustomConfig[] = [
  {
    id: 'holy_dagger',
    name: '破邪の霊剣 (Holy Spirit Blades)',
    category: 'weapon',
    tier: 'rare',
    emoji: '🗡️',
    desc: '自動追尾の退魔霊剣を+1本放ち、基本攻撃力を大幅強化(+6)',
    maxLevel: 5,
    projCountBonus: 1,
    damageBonus: 6,
  },
  {
    id: 'orbital_bible',
    name: '護符・禁断法典 (Sacred Grimoire)',
    category: 'weapon',
    tier: 'epic',
    emoji: '📖',
    desc: '周囲を旋回する神聖結界書を召喚し、接近する妖魔を粉砕する',
    maxLevel: 5,
    orbitersBonus: 1,
  },
  {
    id: 'thunder_strike',
    name: '天雷招来・轟絶 (Divine Thunder)',
    category: 'weapon',
    tier: 'epic',
    emoji: '⚡',
    desc: '蒼天より神雷を降らせ群敵を一掃。発動間隔を0.6秒短縮',
    maxLevel: 4,
    cooldownReduction: 0.6,
    damageBonus: 10,
  },
  {
    id: 'giant_cleave',
    name: '一刀両断・剛刃 (Giant Cleave)',
    category: 'weapon',
    tier: 'rare',
    emoji: '🪓',
    desc: '攻撃ダメージ+12、さらに貫通力+1で敵集団を薙ぎ払う',
    maxLevel: 4,
    damageBonus: 12,
  },
  {
    id: 'rapid_wand',
    name: '神速の秘術杖 (Rapid Wand)',
    category: 'weapon',
    tier: 'common',
    emoji: '🪄',
    desc: '全武器・術式の詠唱速度＆攻撃速度が25%上昇',
    maxLevel: 5,
  },
  {
    id: 'swift_boots',
    name: '疾風・天翔の具足 (Swift Boots)',
    category: 'passive',
    tier: 'common',
    emoji: '👢',
    desc: '移動速度+25。敵の包囲網を軽快にすり抜ける',
    maxLevel: 4,
    speedBonus: 25,
  },
  {
    id: 'vitality_ring',
    name: '不死鳥の血戒 (Phoenix Ring)',
    category: 'passive',
    tier: 'rare',
    emoji: '🩸',
    desc: '最大生命力+30、さらに即座に体力を40回復',
    maxLevel: 5,
    hpBonus: 30,
  },
  {
    id: 'super_magnet',
    name: '渦潮の勾玉 (Vortex Magatama)',
    category: 'passive',
    tier: 'epic',
    emoji: '🧲',
    desc: '霊力結晶の吸引範囲を+60拡大。画面中の魔力を一気に回収',
    maxLevel: 3,
    magnetBonus: 60,
  },
  {
    id: 'crit_frenzy',
    name: '会心の一撃・極 (Critical Frenzy)',
    category: 'passive',
    tier: 'rare',
    emoji: '💥',
    desc: '会心率(暴擊)+15%、会心ダメージ倍率+40%の超火力',
    maxLevel: 4,
    critBonus: 0.15,
  },
  {
    id: 'iron_armor',
    name: '金剛不壊の霊甲 (Adamantine Armor)',
    category: 'passive',
    tier: 'common',
    emoji: '🛡️',
    desc: '全被ダメージを12%軽減する堅牢な護身結界',
    maxLevel: 4,
    armorBonus: 0.12,
  },
];

export const DEFAULT_GAME_CONFIG: GameConfig = {
  passkey: '8888',
  currentStageId: 'stage_1',
  selectedHeroClassId: 'mage',
  stages: DEFAULT_CAMPAIGN_STAGES,
  heroClasses: DEFAULT_HERO_CLASSES,
  enemies: DEFAULT_ENEMIES,
  perks: DEFAULT_PERKS,
  sprites: DEFAULT_SPRITE_LIBRARY,
};

const STORAGE_KEY = 'onehand_survivor_custom_config_v3';
const UNLOCKED_STAGES_KEY = 'onehand_survivor_unlocked_stages';

const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return memoryStorage[key] ?? null;
}

function safeSetItem(key: string, val: string): void {
  memoryStorage[key] = val;
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, val);
    }
  } catch {
    // fallback
  }
}

function safeRemoveItem(key: string): void {
  delete memoryStorage[key];
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(key);
    }
  } catch {
    // fallback
  }
}

export function loadGameConfig(): GameConfig {
  try {
    // Try current key, fallback to v2
    const raw = safeGetItem(STORAGE_KEY) || safeGetItem('onehand_survivor_custom_config_v2');
    if (raw) {
      const parsed = JSON.parse(raw);

      // Ensure hero classes have valid spriteId
      const heroClasses = (parsed.heroClasses && parsed.heroClasses.length ? parsed.heroClasses : DEFAULT_HERO_CLASSES).map((h: HeroClass) => ({
        ...h,
        spriteId: h.spriteId || (h.category === 'ronin' ? 'hero_ronin' : h.category === 'ranger' ? 'hero_ranger' : h.category === 'paladin' ? 'hero_paladin' : 'hero_mage'),
      }));

      // Ensure enemies have valid spriteId
      const enemies = (parsed.enemies && parsed.enemies.length ? parsed.enemies : DEFAULT_ENEMIES).map((e: EnemyCustomConfig) => ({
        ...e,
        spriteId: e.spriteId || (e.type === 'swarmer' ? 'mob_slime' : e.type === 'dasher' ? 'mob_bat' : e.type === 'archer' ? 'mob_archer' : e.type === 'boss' ? 'boss_demon' : e.type === 'elite' ? 'boss_oni' : e.type === 'nine_tails' ? 'boss_nine_tails' : 'mob_slime'),
      }));

      return {
        passkey: parsed.passkey || DEFAULT_GAME_CONFIG.passkey,
        currentStageId: parsed.currentStageId || DEFAULT_GAME_CONFIG.currentStageId,
        selectedHeroClassId: parsed.selectedHeroClassId || DEFAULT_GAME_CONFIG.selectedHeroClassId,
        stages: parsed.stages && parsed.stages.length ? parsed.stages : DEFAULT_CAMPAIGN_STAGES,
        heroClasses,
        enemies,
        perks: parsed.perks && parsed.perks.length ? parsed.perks : DEFAULT_PERKS,
        sprites: Array.isArray(parsed.sprites) && parsed.sprites.length > 0 ? parsed.sprites : DEFAULT_SPRITE_LIBRARY,
      };
    }
  } catch (err) {
    console.error('Failed to load config from storage', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG));
}

export function saveGameConfig(cfg: GameConfig): void {
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.error('Failed to save config to storage', err);
  }
}

export function resetGameConfig(): GameConfig {
  try {
    safeRemoveItem(STORAGE_KEY);
    safeRemoveItem('onehand_survivor_custom_config_v2');
  } catch {
    // Ignore
  }
  return JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG));
}

export function exportConfigJson(cfg: GameConfig): string {
  return JSON.stringify(cfg, null, 2);
}

export function importConfigJson(jsonStr: string): GameConfig | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return null;

    const heroClasses = (Array.isArray(parsed.heroClasses) && parsed.heroClasses.length ? parsed.heroClasses : DEFAULT_HERO_CLASSES).map((h: HeroClass) => ({
      ...h,
      spriteId: h.spriteId || (h.category === 'ronin' ? 'hero_ronin' : h.category === 'ranger' ? 'hero_ranger' : h.category === 'paladin' ? 'hero_paladin' : 'hero_mage'),
    }));

    const enemies = (Array.isArray(parsed.enemies) && parsed.enemies.length ? parsed.enemies : DEFAULT_ENEMIES).map((e: EnemyCustomConfig) => ({
      ...e,
      spriteId: e.spriteId || 'mob_slime',
    }));

    return {
      passkey: parsed.passkey || DEFAULT_GAME_CONFIG.passkey,
      currentStageId: parsed.currentStageId || DEFAULT_GAME_CONFIG.currentStageId,
      selectedHeroClassId: parsed.selectedHeroClassId || DEFAULT_GAME_CONFIG.selectedHeroClassId,
      stages: Array.isArray(parsed.stages) && parsed.stages.length ? parsed.stages : DEFAULT_CAMPAIGN_STAGES,
      heroClasses,
      enemies,
      perks: Array.isArray(parsed.perks) && parsed.perks.length ? parsed.perks : DEFAULT_PERKS,
      sprites: Array.isArray(parsed.sprites) && parsed.sprites.length > 0 ? parsed.sprites : DEFAULT_SPRITE_LIBRARY,
    };
  } catch {
    return null;
  }
}

export function loadUnlockedStages(): string[] {
  try {
    const raw = safeGetItem(UNLOCKED_STAGES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  return ['stage_1'];
}

export function unlockStage(stageId: string): void {
  try {
    const current = loadUnlockedStages();
    if (!current.includes(stageId)) {
      current.push(stageId);
      safeSetItem(UNLOCKED_STAGES_KEY, JSON.stringify(current));
    }
  } catch {
    // Ignore
  }
}

