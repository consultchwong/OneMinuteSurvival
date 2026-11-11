import { PerkDefinition } from './rules';
import { PerkCustomConfig } from './customConfig';

export const ALL_PERKS: PerkDefinition[] = [
  {
    id: 'holy_dagger',
    name: '破邪の霊剣 (Holy Spirit Blades)',
    category: 'weapon',
    tier: 'rare',
    emoji: '🗡️',
    desc: '自動追尾の退魔霊剣を+1本放ち、基本攻撃力を大幅強化(+6)',
    maxLevel: 5,
  },
  {
    id: 'orbital_bible',
    name: '護符・禁断法典 (Sacred Grimoire)',
    category: 'weapon',
    tier: 'epic',
    emoji: '📖',
    desc: '周囲を旋回する神聖結界書を召喚し、接近する妖魔を粉砕する',
    maxLevel: 5,
  },
  {
    id: 'thunder_strike',
    name: '天雷招来・轟絶 (Divine Thunder)',
    category: 'weapon',
    tier: 'epic',
    emoji: '⚡',
    desc: '蒼天より神雷を降らせ群敵を一掃。発動間隔を0.6秒短縮',
    maxLevel: 4,
  },
  {
    id: 'giant_cleave',
    name: '一刀両断・剛刃 (Giant Cleave)',
    category: 'weapon',
    tier: 'rare',
    emoji: '🪓',
    desc: '攻撃ダメージ+12、さらに貫通力+1で敵集団を薙ぎ払う',
    maxLevel: 4,
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
  },
  {
    id: 'vitality_ring',
    name: '不死鳥の血戒 (Phoenix Ring)',
    category: 'passive',
    tier: 'rare',
    emoji: '🩸',
    desc: '最大生命力+30、さらに即座に体力を40回復',
    maxLevel: 5,
  },
  {
    id: 'super_magnet',
    name: '渦潮の勾玉 (Vortex Magatama)',
    category: 'passive',
    tier: 'epic',
    emoji: '🧲',
    desc: '霊力結晶の吸引範囲を+60拡大。画面中の魔力を一気に回収',
    maxLevel: 3,
  },
  {
    id: 'crit_frenzy',
    name: '会心の一撃・極 (Critical Frenzy)',
    category: 'passive',
    tier: 'rare',
    emoji: '💥',
    desc: '会心率(暴擊)+15%、会心ダメージ倍率+40%の超火力',
    maxLevel: 4,
  },
  {
    id: 'iron_armor',
    name: '金剛不壊の霊甲 (Adamantine Armor)',
    category: 'passive',
    tier: 'common',
    emoji: '🛡️',
    desc: '全被ダメージを12%軽減する堅牢な護身結界',
    maxLevel: 4,
  },
];

export function rollThreePerks(
  acquiredPerks: Record<string, number>,
  guaranteeHighTier: boolean = false,
  customPerksList?: PerkCustomConfig[]
): PerkDefinition[] {
  const sourceList: PerkDefinition[] = (customPerksList && customPerksList.length > 0)
    ? customPerksList.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        tier: p.tier,
        emoji: p.emoji,
        desc: p.desc,
        maxLevel: p.maxLevel,
      }))
    : ALL_PERKS;

  const available = sourceList.filter(
    (p) => (acquiredPerks[p.id] || 0) < p.maxLevel
  );

  if (available.length <= 3) {
    return available;
  }

  const pool = [...available];
  if (guaranteeHighTier) {
    pool.sort((a, b) => {
      const weight = { epic: 3, rare: 2, common: 1 };
      return weight[b.tier] - weight[a.tier] + (Math.random() - 0.5);
    });
  } else {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  return pool.slice(0, 3);
}
