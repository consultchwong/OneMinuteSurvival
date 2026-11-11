/**
 * Sprite Library System (靈魂造型 Sprite 庫)
 * Contains 32+ default Japanese Anime Fantasy Sprites for Heroes, Monsters, and Bosses.
 * Supports custom sprite creation, editing, category filtering, and high-fidelity canvas rendering.
 */

export type SpriteCategory = 'hero' | 'monster' | 'boss';

export type BodyShape =
  | 'humanoid'
  | 'mage_robe'
  | 'samurai'
  | 'archer'
  | 'knight'
  | 'onmyoji'
  | 'ninja'
  | 'monk'
  | 'valkyrie'
  | 'gunner'
  | 'miko'
  | 'dragon_knight'
  | 'slime'
  | 'bat'
  | 'skeleton'
  | 'spider'
  | 'ghost'
  | 'imp'
  | 'wolf'
  | 'golem'
  | 'lich'
  | 'oni'
  | 'nine_tails'
  | 'dragon'
  | 'reaper';

export interface SpriteAssetConfig {
  id: string;
  name: string;
  category: SpriteCategory;
  emoji: string;
  shape: BodyShape;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  weaponEmoji?: string;
  customImageUrl?: string;
  desc?: string;
  tags?: string[];
}

export const DEFAULT_SPRITE_LIBRARY: SpriteAssetConfig[] = [
  // --- HEROES (12) ---
  {
    id: 'hero_mage',
    name: '大魔導士・アルス (Ars)',
    category: 'hero',
    emoji: '🧙‍♂️',
    shape: 'mage_robe',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e3a8a',
    accentColor: '#facc15',
    weaponEmoji: '🪄',
    desc: '身披星辰蔚藍魔導袍，手持天界魔導權杖，腳踏六芒星法陣。',
    tags: ['法師', '遠程', '魔法', '主角'],
  },
  {
    id: 'hero_ronin',
    name: '浪人劍聖・レン (Ren)',
    category: 'hero',
    emoji: '🗡️',
    shape: 'samurai',
    primaryColor: '#0f172a',
    secondaryColor: '#dc2626',
    accentColor: '#f59e0b',
    weaponEmoji: '⚔️',
    desc: '頭戴黑曜草笠，身著疾風紅黑羽織，拔刀居合無影無蹤。',
    tags: ['劍士', '近戰', '居合', '浪人'],
  },
  {
    id: 'hero_ranger',
    name: '精靈神射手・ライラ (Lyra)',
    category: 'hero',
    emoji: '🏹',
    shape: 'archer',
    primaryColor: '#10b981',
    secondaryColor: '#064e3b',
    accentColor: '#a7f3d0',
    weaponEmoji: '🏹',
    desc: '精靈森林之守護者，翠綠羽冠與風靈長弓，移動輕靈如燕。',
    tags: ['射手', '精靈', '遠程', '迅捷'],
  },
  {
    id: 'hero_paladin',
    name: '聖殿騎士・ローランド (Roland)',
    category: 'hero',
    emoji: '🛡️',
    shape: 'knight',
    primaryColor: '#e2e8f0',
    secondaryColor: '#b45309',
    accentColor: '#facc15',
    weaponEmoji: '🛡️',
    desc: '身披白銀重甲與金羽頭盔，神聖護盾堅不可摧。',
    tags: ['坦克', '聖騎士', '防禦', '金剛'],
  },
  {
    id: 'hero_onmyoji',
    name: '陰陽乾坤師・晴明',
    category: 'hero',
    emoji: '☯️',
    shape: 'onmyoji',
    primaryColor: '#f8fafc',
    secondaryColor: '#1e1b4b',
    accentColor: '#a855f7',
    weaponEmoji: '📜',
    desc: '執掌陰陽乾坤太極，身著黑白道袍，符咒旋轉護體。',
    tags: ['陰陽師', '符咒', '爆發', '神道'],
  },
  {
    id: 'hero_ninja',
    name: '伊賀隱密影忍・疾風',
    category: 'hero',
    emoji: '🥷',
    shape: 'ninja',
    primaryColor: '#18181b',
    secondaryColor: '#6366f1',
    accentColor: '#38bdf8',
    weaponEmoji: '🗡️',
    desc: '暗夜中穿梭的影之暗殺者，雙手短忍刀與暗影面罩。',
    tags: ['忍者', '刺客', '暗影', '速度'],
  },
  {
    id: 'hero_monk',
    name: '乾坤拳皇武僧・無念',
    category: 'hero',
    emoji: '🥊',
    shape: 'monk',
    primaryColor: '#ea580c',
    secondaryColor: '#7c2d12',
    accentColor: '#fde047',
    weaponEmoji: '💥',
    desc: '以肉身修煉剛體武學，金剛戰念珠與烈火拳套。',
    tags: ['格鬥', '武僧', '暴擊', '剛體'],
  },
  {
    id: 'hero_valkyrie',
    name: '蒼穹女武神・布倫希爾德',
    category: 'hero',
    emoji: '👑',
    shape: 'valkyrie',
    primaryColor: '#fbbf24',
    secondaryColor: '#38bdf8',
    accentColor: '#ffffff',
    weaponEmoji: '🔱',
    desc: '背負星辰神聖光翼，黃金王冠與蒼穹聖矛。',
    tags: ['女武神', '神聖', '光翼', '皇族'],
  },
  {
    id: 'hero_gunner',
    name: '魔導銃士・文森',
    category: 'hero',
    emoji: '🔫',
    shape: 'gunner',
    primaryColor: '#78350f',
    secondaryColor: '#451a03',
    accentColor: '#38bdf8',
    weaponEmoji: '🔫',
    desc: '蒸氣龐克護目鏡與皮質大風衣，雙持魔導速射晶石槍。',
    tags: ['槍手', '魔導', '機關', '連射'],
  },
  {
    id: 'hero_miko',
    name: '白狐巫女・玉藻',
    category: 'hero',
    emoji: '🦊',
    shape: 'miko',
    primaryColor: '#dc2626',
    secondaryColor: '#ffffff',
    accentColor: '#f43f5e',
    weaponEmoji: '🪭',
    desc: '紅白傳統神社巫女服，靈狐神耳與祓魔御幣。',
    tags: ['巫女', '神道', '靈狐', '結界'],
  },
  {
    id: 'hero_bard',
    name: '幻音吟遊詩人・艾倫',
    category: 'hero',
    emoji: '🎸',
    shape: 'humanoid',
    primaryColor: '#8b5cf6',
    secondaryColor: '#4c1d95',
    accentColor: '#34d399',
    weaponEmoji: '🪕',
    desc: '頭戴翠綠羽毛寬簷帽，奏響七弦琴召喚音律衝擊。',
    tags: ['詩人', '音樂', '光環', '輔助'],
  },
  {
    id: 'hero_dragon_knight',
    name: '龍血狂戰士・席格',
    category: 'hero',
    emoji: '🐲',
    shape: 'dragon_knight',
    primaryColor: '#991b1b',
    secondaryColor: '#450a0a',
    accentColor: '#f97316',
    weaponEmoji: '🪓',
    desc: '赤紅龍鱗重甲與龍角頭盔，雙手大巨斧橫掃千軍。',
    tags: ['狂戰', '龍血', '重擊', '烈焰'],
  },

  // --- MONSTERS (12) ---
  {
    id: 'mob_slime',
    name: '碧玉軟泥怪 (Slime)',
    category: 'monster',
    emoji: '🟢',
    shape: 'slime',
    primaryColor: '#22c55e',
    secondaryColor: '#15803d',
    accentColor: '#86efac',
    desc: '果凍般彈跳的小型水靈妖魔，成群結隊湧來。',
    tags: ['史萊姆', '小怪', '群體'],
  },
  {
    id: 'mob_bat',
    name: '疾風妖蝠 (Vampire Bat)',
    category: 'monster',
    emoji: '🦇',
    shape: 'bat',
    primaryColor: '#8b5cf6',
    secondaryColor: '#4c1d95',
    accentColor: '#ef4444',
    desc: '高速飛行的吸血夜蝠，移動迅速難以捉摸。',
    tags: ['蝙蝠', '疾風', '飛行'],
  },
  {
    id: 'mob_skeleton',
    name: '骷髏白骨兵 (Skeleton)',
    category: 'monster',
    emoji: '💀',
    shape: 'skeleton',
    primaryColor: '#e2e8f0',
    secondaryColor: '#64748b',
    accentColor: '#cbd5e1',
    desc: '自地下爬出的白骨士兵，手持生鏽古刀。',
    tags: ['亡靈', '骷髏', '步卒'],
  },
  {
    id: 'mob_archer',
    name: '骸骨暗影弓手 (Skeleton Archer)',
    category: 'monster',
    emoji: '🏹',
    shape: 'archer',
    primaryColor: '#94a3b8',
    secondaryColor: '#475569',
    accentColor: '#ef4444',
    desc: '躲在後方遠程狙擊的白骨弓箭手。',
    tags: ['遠程', '骷髏', '弓箭'],
  },
  {
    id: 'mob_spider',
    name: '毒瘴巨蛛 (Poison Spider)',
    category: 'monster',
    emoji: '🕷️',
    shape: 'spider',
    primaryColor: '#14532d',
    secondaryColor: '#166534',
    accentColor: '#4ade80',
    desc: '腹部鼓脹著致命劇毒的暗綠毒蛛，會噴射毒液。',
    tags: ['蜘蛛', '劇毒', '噴吐'],
  },
  {
    id: 'mob_ghost',
    name: '幽冥女妖 (Banshee Ghost)',
    category: 'monster',
    emoji: '👻',
    shape: 'ghost',
    primaryColor: '#06b6d4',
    secondaryColor: '#0891b2',
    accentColor: '#cffafe',
    desc: '半透明浮游幽靈，不受地形阻擋穿梭飄盪。',
    tags: ['亡魂', '幽靈', '穿透'],
  },
  {
    id: 'mob_imp',
    name: '烈焰火精靈 (Flame Imp)',
    category: 'monster',
    emoji: '👺',
    shape: 'imp',
    primaryColor: '#ea580c',
    secondaryColor: '#9a3412',
    accentColor: '#fdba74',
    desc: '周身環繞烈火的小惡魔，移動帶著火星塵埃。',
    tags: ['火系', '衝鋒', '小鬼'],
  },
  {
    id: 'mob_wolf',
    name: '暗夜嗜血狼 (Blood Wolf)',
    category: 'monster',
    emoji: '🐺',
    shape: 'wolf',
    primaryColor: '#334155',
    secondaryColor: '#1e293b',
    accentColor: '#dc2626',
    desc: '雙目發紅的飢餓狂狼，以極快速度飛撲目標。',
    tags: ['野獸', '狼', '突襲'],
  },
  {
    id: 'mob_golem',
    name: '狂暴巨岩泰坦 (Rock Golem)',
    category: 'monster',
    emoji: '🗿',
    shape: 'golem',
    primaryColor: '#57534e',
    secondaryColor: '#292524',
    accentColor: '#a8a29e',
    desc: '渾身由古代巨石構築的守護石像，極難擊退。',
    tags: ['石像', '重裝', '肉盾', '精英'],
  },
  {
    id: 'mob_zombie',
    name: '深淵詛咒殭屍 (Cursed Zombie)',
    category: 'monster',
    emoji: '🧟',
    shape: 'humanoid',
    primaryColor: '#3f6212',
    secondaryColor: '#1a2e05',
    accentColor: '#bef264',
    desc: '蹣跚向前卻擁有厚重生命值的深淵喪屍。',
    tags: ['殭屍', '死靈', '耐打'],
  },
  {
    id: 'mob_lich',
    name: '幽冥巫妖 (Necro Lich)',
    category: 'monster',
    emoji: '🔮',
    shape: 'lich',
    primaryColor: '#7e22ce',
    secondaryColor: '#3b0764',
    accentColor: '#d8b4fe',
    desc: '漂浮在空中的邪靈巫妖，週期性釋放紫魂追蹤彈。',
    tags: ['巫妖', '遠程', '法球', '精英'],
  },
  {
    id: 'mob_shroom',
    name: '迷幻蘑菇怪 (Psycho Shroom)',
    category: 'monster',
    emoji: '🍄',
    shape: 'slime',
    primaryColor: '#db2777',
    secondaryColor: '#831843',
    accentColor: '#fbcfe8',
    desc: '色彩鮮豔的奇幻蘑菇，彈跳移動並散播孢子。',
    tags: ['蘑菇', '毒物', '怪誕'],
  },

  // --- BOSSES (8) ---
  {
    id: 'boss_oni',
    name: '赤鬼羅剎狂神 (Elite Oni)',
    category: 'boss',
    emoji: '👹',
    shape: 'oni',
    primaryColor: '#b91c1c',
    secondaryColor: '#450a0a',
    accentColor: '#facc15',
    desc: '額生赤角、手握鬼神金棒的修羅巨擘，近戰威能無比駭人。',
    tags: ['BOSS', '赤鬼', '霸體', '修羅'],
  },
  {
    id: 'boss_demon',
    name: '深淵魔王・極 (Abyss Demon Lord)',
    category: 'boss',
    emoji: '👿',
    shape: 'oni',
    primaryColor: '#881337',
    secondaryColor: '#4c0519',
    accentColor: '#f43f5e',
    desc: '深淵第層的極致魔君，周身黑曜魔焰燃燒不息。',
    tags: ['BOSS', '魔王', '極限', '深淵'],
  },
  {
    id: 'boss_nine_tails',
    name: '絕代九尾狐女王 (Nine-Tailed Fox Empress)',
    category: 'boss',
    emoji: '🦊',
    shape: 'nine_tails',
    primaryColor: '#ec4899',
    secondaryColor: '#be185d',
    accentColor: '#38bdf8',
    desc: '身負九條耀眼仙狐神尾的女帝，發射三向粉藍狐火狂嵐。',
    tags: ['BOSS', '九尾狐', '妖王', '彈幕'],
  },
  {
    id: 'boss_dragon',
    name: '滅世漆黑邪龍 (Black Cataclysm Dragon)',
    category: 'boss',
    emoji: '🐉',
    shape: 'dragon',
    primaryColor: '#09090b',
    secondaryColor: '#18181b',
    accentColor: '#ef4444',
    desc: '降臨於熔岩廢墟之巔的古代邪黑龍，巨翼遮天。',
    tags: ['BOSS', '黑龍', '毀滅', '終焉'],
  },
  {
    id: 'boss_reaper',
    name: '混沌暗黑死神 (Grim Reaper)',
    category: 'boss',
    emoji: '🦹',
    shape: 'reaper',
    primaryColor: '#030712',
    secondaryColor: '#111827',
    accentColor: '#06b6d4',
    desc: '收割一切生命之魂的虛空死神，巨大死亡鐮刀劃破虛空。',
    tags: ['BOSS', '死神', '虛空', '鐮刀'],
  },
  {
    id: 'boss_lich_king',
    name: '天冥至尊巫妖王 (Arch-Lich King)',
    category: 'boss',
    emoji: '👑🔮',
    shape: 'lich',
    primaryColor: '#581c87',
    secondaryColor: '#2e1065',
    accentColor: '#c084fc',
    desc: '掌控萬千亡靈法皇冠冕的巫妖至尊。',
    tags: ['BOSS', '巫妖王', '亡靈', '至尊'],
  },
  {
    id: 'boss_titan',
    name: '蒼穹雷霆巨神兵 (Thunder Titan)',
    category: 'boss',
    emoji: '⚡🗿',
    shape: 'golem',
    primaryColor: '#0284c7',
    secondaryColor: '#075985',
    accentColor: '#facc15',
    desc: '沐浴天道雷霆的黃金古代巨神機關。',
    tags: ['BOSS', '神兵', '雷霆', '古代'],
  },
  {
    id: 'boss_kraken',
    name: '深海邪神克蘇魯 (Abyssal Kraken)',
    category: 'boss',
    emoji: '🐙',
    shape: 'slime',
    primaryColor: '#312e81',
    secondaryColor: '#1e1b4b',
    accentColor: '#2dd4bf',
    desc: '自異界深海爬出的不可名狀邪神觸手狂潮。',
    tags: ['BOSS', '克蘇魯', '深海', '邪神'],
  },
];

/**
 * Find a sprite by ID from a custom sprite library list
 */
export function getSpriteById(
  sprites: SpriteAssetConfig[] | undefined,
  spriteId?: string
): SpriteAssetConfig {
  const library = sprites && sprites.length > 0 ? sprites : DEFAULT_SPRITE_LIBRARY;
  if (spriteId) {
    const found = library.find((s) => s.id === spriteId);
    if (found) return found;
  }
  return library[0] || DEFAULT_SPRITE_LIBRARY[0];
}

/**
 * Universal Canvas Renderer for ANY Sprite in the Library!
 * Supports walking cycles, 4-direction orientation, weapon rendering, and custom uploaded images.
 */
export function renderSpriteInCanvas(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteAssetConfig,
  x: number,
  y: number,
  size: number = 44,
  dir: 'down' | 'up' | 'left' | 'right' = 'down',
  walkCycle: number = 0,
  isMoving: boolean = false,
  isPromoted: boolean = false,
  auraColor: string = '#facc15',
  customImageElement?: HTMLImageElement | null
) {
  ctx.save();
  ctx.translate(x, y);

  // Promoted Celestial Aura
  if (isPromoted) {
    ctx.save();
    const auraPulse = Math.sin(walkCycle * 0.8) * 4;
    ctx.strokeStyle = auraColor;
    ctx.shadowColor = auraColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(0, 8, size * 0.7 + auraPulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.65, 12, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  // If custom image element is present and successfully loaded
  if (customImageElement && customImageElement.complete && customImageElement.naturalWidth > 0) {
    const bob = isMoving ? Math.sin(walkCycle) * 3 : 0;
    const flipX = dir === 'left' ? -1 : 1;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.45, size * 0.45, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.scale(flipX, 1);
    ctx.beginPath();
    ctx.arc(0, bob, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(customImageElement, -size / 2, -size / 2 + bob, size, size);
    ctx.restore();

    ctx.strokeStyle = isPromoted ? auraColor : sprite.accentColor || '#facc15';
    ctx.lineWidth = isPromoted ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, bob, size / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    return;
  }

  // PROCEDURAL SPRITE RENDERING
  const bob = isMoving ? Math.sin(walkCycle) * 3 : Math.sin(walkCycle * 0.5) * 1.2;
  const legSwing = isMoving ? Math.sin(walkCycle) * 6 : 0;
  const weaponSwing = isMoving ? Math.cos(walkCycle) * 0.25 : 0;
  const flipX = dir === 'left' ? -1 : 1;

  // Ground Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.42, size * 0.42, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.scale(flipX, 1);

  const pColor = sprite.primaryColor;
  const sColor = sprite.secondaryColor;
  const aColor = sprite.accentColor;

  switch (sprite.shape) {
    case 'slime': {
      // Bouncy Slime Sprite
      const squishX = 1 + Math.sin(walkCycle * 2) * 0.12;
      const squishY = 1 - Math.sin(walkCycle * 2) * 0.12;
      ctx.save();
      ctx.scale(squishX, squishY);

      // Body Gradient
      const grad = ctx.createRadialGradient(0, -4, 2, 0, 0, size * 0.45);
      grad.addColorStop(0, aColor);
      grad.addColorStop(0.7, pColor);
      grad.addColorStop(1, sColor);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 4 + bob, size * 0.42, size * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slime Gloss Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-size * 0.14, -size * 0.05 + bob, size * 0.12, size * 0.07, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Cute/Menacing Eyes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-6, 2 + bob, 2.8, 0, Math.PI * 2);
      ctx.arc(6, 2 + bob, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-7, 1 + bob, 1, 0, Math.PI * 2);
      ctx.arc(5, 1 + bob, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'bat': {
      // Flapping Bat
      const wingFlap = Math.sin(walkCycle * 4) * 0.6;
      ctx.fillStyle = sColor;
      // Left Wing
      ctx.save();
      ctx.translate(-8, -2 + bob);
      ctx.rotate(-wingFlap);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size * 0.45, -size * 0.25);
      ctx.lineTo(-size * 0.25, size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Right Wing
      ctx.save();
      ctx.translate(8, -2 + bob);
      ctx.rotate(wingFlap);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size * 0.45, -size * 0.25);
      ctx.lineTo(size * 0.25, size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Body & Ears
      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.ellipse(0, 0 + bob, size * 0.22, size * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red Glowing Eyes
      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.arc(-4, -2 + bob, 2, 0, Math.PI * 2);
      ctx.arc(4, -2 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'spider': {
      // 8-Legged Poison Spider
      const legOffset = Math.sin(walkCycle * 3) * 4;
      ctx.strokeStyle = sColor;
      ctx.lineWidth = 2.5;

      // Legs
      for (let i = 0; i < 4; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const ly = (i - 1.5) * 6;
        ctx.beginPath();
        ctx.moveTo(0, ly + bob);
        ctx.lineTo(side * (size * 0.38), ly - 4 + legOffset * (side > 0 ? 1 : -1) + bob);
        ctx.lineTo(side * (size * 0.48), ly + 8 + bob);
        ctx.stroke();
      }

      // Spider Abdomen
      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.ellipse(0, -6 + bob, size * 0.28, size * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Toxic Markings
      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.arc(0, -6 + bob, 4, 0, Math.PI * 2);
      ctx.fill();

      // Head & Eyes
      ctx.fillStyle = sColor;
      ctx.beginPath();
      ctx.arc(0, 7 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.arc(-2.5, 7 + bob, 1.5, 0, Math.PI * 2);
      ctx.arc(2.5, 7 + bob, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'ghost': {
      // Ethereal Banshee Ghost
      const driftX = Math.sin(walkCycle * 1.5) * 3;
      ctx.save();
      ctx.translate(driftX, bob);

      ctx.fillStyle = sColor;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(0, -6, size * 0.32, Math.PI, 0, false);
      ctx.lineTo(size * 0.3, size * 0.35);
      // Wavy spectral tail
      ctx.quadraticCurveTo(size * 0.15, size * 0.25, 0, size * 0.38);
      ctx.quadraticCurveTo(-size * 0.15, size * 0.25, -size * 0.3, size * 0.35);
      ctx.closePath();
      ctx.fill();

      // Ghost Eyes & Mouth
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(-5, -6, 2.5, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(5, -6, 2.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, 1, 3, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.restore();
      break;
    }

    case 'golem': {
      // Chunky Stone Golem
      ctx.fillStyle = sColor;
      ctx.fillRect(-12, 10 + legSwing, 9, 10);
      ctx.fillRect(3, 10 - legSwing, 9, 10);

      // Huge Stone Torso
      ctx.fillStyle = pColor;
      ctx.strokeStyle = aColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-16, -10 + bob, 32, 22, 6);
      ctx.fill();
      ctx.stroke();

      // Rune on chest
      ctx.strokeStyle = aColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 1 + bob, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Boulder Head & Glowing Slit Eyes
      ctx.fillStyle = sColor;
      ctx.fillRect(-8, -20 + bob, 16, 11);

      ctx.fillStyle = aColor;
      ctx.fillRect(-5, -16 + bob, 3.5, 2);
      ctx.fillRect(2, -16 + bob, 3.5, 2);
      break;
    }

    case 'lich': {
      // Floating Necro Lich
      ctx.fillStyle = sColor;
      ctx.beginPath();
      ctx.moveTo(-12, -4 + bob);
      ctx.lineTo(-18, 16 + bob);
      ctx.lineTo(18, 16 + bob);
      ctx.lineTo(12, -4 + bob);
      ctx.closePath();
      ctx.fill();

      // Gold Trim
      ctx.strokeStyle = aColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Skull Head in Cowl
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, -9 + bob, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Violet Eyes
      ctx.fillStyle = aColor;
      ctx.shadowColor = aColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-3, -9 + bob, 2, 0, Math.PI * 2);
      ctx.arc(3, -9 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Floating Orb in hand
      ctx.fillStyle = aColor;
      ctx.shadowColor = aColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(14, 2 + bob + Math.sin(walkCycle * 2) * 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }

    case 'nine_tails': {
      // Mythical Nine-Tails Fox Empress
      // 9 Animated Tails behind
      for (let t = -4; t <= 4; t++) {
        const tailAngle = (t / 4) * 0.7 + Math.sin(walkCycle * 2 + t * 0.3) * 0.15;
        ctx.save();
        ctx.translate(0, 6 + bob);
        ctx.rotate(tailAngle);
        ctx.fillStyle = t % 2 === 0 ? pColor : aColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(t * 7, -size * 0.55, 0, -size * 0.65);
        ctx.quadraticCurveTo(-t * 5, -size * 0.3, 0, 0);
        ctx.fill();
        ctx.restore();
      }

      // Elegant Kimono
      ctx.fillStyle = sColor;
      ctx.beginPath();
      ctx.moveTo(-11, 0 + bob);
      ctx.lineTo(-15, 16 + bob);
      ctx.lineTo(15, 16 + bob);
      ctx.lineTo(11, 0 + bob);
      ctx.closePath();
      ctx.fill();

      // Face & Fox Ears
      ctx.fillStyle = '#ffe4e6';
      ctx.beginPath();
      ctx.arc(0, -7 + bob, 8, 0, Math.PI * 2);
      ctx.fill();

      // Fox Ears
      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.moveTo(-7, -11 + bob);
      ctx.lineTo(-11, -21 + bob);
      ctx.lineTo(-2, -13 + bob);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(7, -11 + bob);
      ctx.lineTo(11, -21 + bob);
      ctx.lineTo(2, -13 + bob);
      ctx.closePath();
      ctx.fill();

      // Anime Fox Eyes
      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.ellipse(-3.5, -7 + bob, 1.8, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(3.5, -7 + bob, 1.8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default: {
      // HUMANOID / HERO DIRECTIONAL (Mage, Ronin, Ranger, Knight, Onmyoji, Ninja, Monk, etc.)
      // Boots
      ctx.fillStyle = sColor;
      ctx.strokeStyle = aColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-8, 12 + legSwing, 6, 8, 3);
      ctx.roundRect(2, 12 - legSwing, 6, 8, 3);
      ctx.fill();
      ctx.stroke();

      // Cape / Cloak Back
      ctx.fillStyle = sColor;
      ctx.beginPath();
      ctx.moveTo(-13, 2 + bob);
      ctx.lineTo(-17, 16 + bob);
      ctx.lineTo(17, 16 + bob);
      ctx.lineTo(13, 2 + bob);
      ctx.closePath();
      ctx.fill();

      // Torso Outfit
      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.moveTo(-11, 0 + bob);
      ctx.lineTo(-13, 14 + bob);
      ctx.lineTo(13, 14 + bob);
      ctx.lineTo(11, 0 + bob);
      ctx.closePath();
      ctx.fill();

      // Belt / Trim
      ctx.fillStyle = aColor;
      ctx.fillRect(-10, 6 + bob, 20, 2.5);

      // Head
      ctx.fillStyle = '#ffedd5';
      ctx.beginPath();
      ctx.arc(0, -6 + bob, 9, 0, Math.PI * 2);
      ctx.fill();

      // Anime Eyes (if facing down or side)
      if (dir !== 'up') {
        ctx.fillStyle = aColor;
        ctx.beginPath();
        ctx.ellipse(-3.5, -6 + bob, 2, 2.8, 0, 0, Math.PI * 2);
        ctx.ellipse(3.5, -6 + bob, 2, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hair & Headwear
      ctx.fillStyle = sColor;
      ctx.beginPath();
      ctx.moveTo(-9, -8 + bob);
      ctx.quadraticCurveTo(0, -14 + bob, 9, -8 + bob);
      ctx.lineTo(8, -4 + bob);
      ctx.lineTo(4, -5 + bob);
      ctx.lineTo(0, -3 + bob);
      ctx.lineTo(-4, -5 + bob);
      ctx.lineTo(-8, -4 + bob);
      ctx.closePath();
      ctx.fill();

      // Specific Headwear accents
      if (sprite.shape === 'mage_robe') {
        // Wizard Hat
        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.moveTo(-14, -8 + bob);
        ctx.lineTo(14, -8 + bob);
        ctx.lineTo(0, -26 + bob);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = aColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (sprite.shape === 'samurai') {
        // Straw / Obsidian Ronin Kasa Hat
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.ellipse(0, -11 + bob, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = aColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (sprite.shape === 'knight') {
        // Silver Knight Visor with plume
        ctx.fillStyle = aColor;
        ctx.fillRect(-6, -16 + bob, 12, 4);
      }

      // Weapon
      if (sprite.weaponEmoji) {
        ctx.save();
        ctx.translate(14, 2 + bob);
        ctx.rotate(weaponSwing);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sprite.weaponEmoji, 0, 0);
        ctx.restore();
      }
      break;
    }
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Generate a clean SVG Data URL for UI preview badges
 */
export function getSpriteSvgPreview(sprite: SpriteAssetConfig): string {
  if (sprite.customImageUrl) return sprite.customImageUrl;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="${sprite.secondaryColor}" stroke="${sprite.accentColor}" stroke-width="2"/>
    <text x="24" y="28" font-size="22" text-anchor="middle" dominant-baseline="middle">${sprite.emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
