import React, { useState } from 'react';
import {
  X,
  Sliders,
  Image as ImageIcon,
  Skull,
  Zap,
  Save,
  RotateCcw,
  Download,
  Upload,
  Play,
  Plus,
  Trash2,
  Sparkles,
  Lock,
  Shield,
  Layers,
  User,
  Palette,
  Search,
} from 'lucide-react';
import {
  GameConfig,
  CampaignStage,
  HeroClass,
  EnemyCustomConfig,
  PerkCustomConfig,
  saveGameConfig,
  resetGameConfig,
  exportConfigJson,
  importConfigJson,
  PRESET_BACKGROUND_IMAGES,
} from '../game/customConfig';
import {
  SpriteAssetConfig,
  SpriteCategory,
  BodyShape,
  DEFAULT_SPRITE_LIBRARY,
  getSpriteById,
  getSpriteSvgPreview,
} from '../game/spriteLibrary';
import { SpritePickerModal } from './SpritePickerModal';
import { SpriteCanvasPreview } from './SpriteCanvasPreview';

interface DesignStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  onSaveAndApply: (newConfig: GameConfig) => void;
  onTestPlay: (newConfig: GameConfig) => void;
}

export function DesignStudioModal({
  isOpen,
  onClose,
  config: initialConfig,
  onSaveAndApply,
  onTestPlay,
}: DesignStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'stages' | 'enemies' | 'hero_classes' | 'perks' | 'sprites' | 'security' | 'json'>('stages');
  const [config, setConfig] = useState<GameConfig>(() => {
    const copy = JSON.parse(JSON.stringify(initialConfig));
    if (!copy.sprites || !copy.sprites.length) {
      copy.sprites = DEFAULT_SPRITE_LIBRARY;
    }
    return copy;
  });
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [selectedHeroIdx, setSelectedHeroIdx] = useState<number>(0);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [jsonError, setJsonError] = useState<string>('');

  // Sprite Picker Modal State
  const [spritePickerOpen, setSpritePickerOpen] = useState<boolean>(false);
  const [spritePickerTarget, setSpritePickerTarget] = useState<
    { type: 'hero'; index: number } | { type: 'enemy'; index: number } | null
  >(null);
  const [spritePickerCategory, setSpritePickerCategory] = useState<'all' | SpriteCategory>('all');

  // Sprite Library Tab State
  const [spriteFilterCategory, setSpriteFilterCategory] = useState<'all' | SpriteCategory>('all');
  const [spriteSearchQuery, setSpriteSearchQuery] = useState<string>('');
  const [isCreateSpriteOpen, setIsCreateSpriteOpen] = useState<boolean>(false);
  const [newSpriteName, setNewSpriteName] = useState<string>('');
  const [newSpriteCategory, setNewSpriteCategory] = useState<SpriteCategory>('hero');
  const [newSpriteEmoji, setNewSpriteEmoji] = useState<string>('🧙‍♂️');
  const [newSpriteShape, setNewSpriteShape] = useState<BodyShape>('humanoid');
  const [newSpritePrimaryColor, setNewSpritePrimaryColor] = useState<string>('#3b82f6');
  const [newSpriteSecondaryColor, setNewSpriteSecondaryColor] = useState<string>('#1e3a8a');
  const [newSpriteAccentColor, setNewSpriteAccentColor] = useState<string>('#facc15');
  const [newSpriteWeaponEmoji, setNewSpriteWeaponEmoji] = useState<string>('🗡️');
  const [newSpriteCustomImageUrl, setNewSpriteCustomImageUrl] = useState<string>('');
  const [newSpriteDesc, setNewSpriteDesc] = useState<string>('');
  const [newSpriteTags, setNewSpriteTags] = useState<string>('');

  const openSpritePickerForHero = (heroIdx: number) => {
    setSpritePickerTarget({ type: 'hero', index: heroIdx });
    setSpritePickerCategory('hero');
    setSpritePickerOpen(true);
  };

  const openSpritePickerForEnemy = (enemyIdx: number) => {
    const enemy = config.enemies[enemyIdx];
    setSpritePickerTarget({ type: 'enemy', index: enemyIdx });
    setSpritePickerCategory(enemy.type === 'boss' ? 'boss' : 'monster');
    setSpritePickerOpen(true);
  };

  const handleSelectSprite = (selected: SpriteAssetConfig) => {
    if (!spritePickerTarget) return;
    if (spritePickerTarget.type === 'hero') {
      const updated = [...config.heroClasses];
      if (updated[spritePickerTarget.index]) {
        updated[spritePickerTarget.index].spriteId = selected.id;
        setConfig({ ...config, heroClasses: updated });
      }
    } else if (spritePickerTarget.type === 'enemy') {
      const updated = [...config.enemies];
      if (updated[spritePickerTarget.index]) {
        updated[spritePickerTarget.index].spriteId = selected.id;
        setConfig({ ...config, enemies: updated });
      }
    }
    setSpritePickerOpen(false);
  };

  const handleCreateNewSprite = () => {
    if (!newSpriteName.trim()) {
      alert('請填寫造型名稱！');
      return;
    }
    const newId = `custom_sprite_${Date.now()}`;
    const tagsArray = newSpriteTags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const asset: SpriteAssetConfig = {
      id: newId,
      name: newSpriteName.trim(),
      category: newSpriteCategory,
      emoji: newSpriteEmoji.trim() || '✨',
      shape: newSpriteShape,
      primaryColor: newSpritePrimaryColor,
      secondaryColor: newSpriteSecondaryColor,
      accentColor: newSpriteAccentColor,
      weaponEmoji: newSpriteWeaponEmoji.trim() || undefined,
      customImageUrl: newSpriteCustomImageUrl.trim() || undefined,
      desc: newSpriteDesc.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : ['自訂'],
    };

    setConfig((prev) => ({
      ...prev,
      sprites: [...(prev.sprites || DEFAULT_SPRITE_LIBRARY), asset],
    }));

    setIsCreateSpriteOpen(false);
    setNewSpriteName('');
    setNewSpriteDesc('');
    setNewSpriteTags('');
    setNewSpriteCustomImageUrl('');
    alert(`成功新增造型「${asset.name}」至靈魂造型 Sprite 庫！`);
  };

  const handleDeleteSprite = (spriteId: string) => {
    if (DEFAULT_SPRITE_LIBRARY.some((d) => d.id === spriteId)) {
      if (!window.confirm('此造型為預設造型之一，確定要自庫中刪除嗎？')) return;
    } else {
      if (!window.confirm('確定要刪除此自訂造型嗎？')) return;
    }

    setConfig((prev) => ({
      ...prev,
      sprites: (prev.sprites || DEFAULT_SPRITE_LIBRARY).filter((s) => s.id !== spriteId),
    }));
  };

  const handleResetSpritesToDefault = () => {
    if (window.confirm('確定要恢復靈魂造型庫為預設的 32 款經典動漫造型嗎？')) {
      setConfig((prev) => ({
        ...prev,
        sprites: [...DEFAULT_SPRITE_LIBRARY],
      }));
    }
  };

  if (!isOpen) return null;

  const currentStage = config.stages[selectedStageIdx] || config.stages[0];
  const currentHero = config.heroClasses[selectedHeroIdx] || config.heroClasses[0];

  const handleSave = () => {
    saveGameConfig(config);
    onSaveAndApply(config);
  };

  const handleTestPlay = () => {
    saveGameConfig(config);
    onTestPlay(config);
  };

  const handleReset = () => {
    if (window.confirm('確定要恢復預設遊戲設計配置嗎？所有自訂關卡與魔物修改將被重置。')) {
      const def = resetGameConfig();
      setConfig(def);
      setSelectedStageIdx(0);
      setSelectedHeroIdx(0);
      onSaveAndApply(def);
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportConfigJson(config);
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    });
  };

  const handleImportJson = () => {
    setJsonError('');
    const imported = importConfigJson(jsonInput);
    if (!imported) {
      setJsonError('JSON 格式無效，請確認輸入完整的遊戲配置 JSON。');
      return;
    }
    setConfig(imported);
    saveGameConfig(imported);
    onSaveAndApply(imported);
    alert('配置匯入成功並已自動套用！');
  };

  // --- STAGE ACTIONS ---
  const handleAddNewStage = () => {
    const nextNum = config.stages.length + 1;
    const newStage: CampaignStage = {
      id: `stage_${Date.now()}`,
      stageNumber: nextNum,
      title: `第${nextNum}關：自訂深淵試煉`,
      subtitle: '極限死守 · 全新魔境討伐',
      survivalTime: 60,
      bossWaveTime: 48,
      backgroundPreset: 'crystal_forest',
      customBackgroundUrl: '',
      ambientParticle: 'stardust',
      spawnRateMultiplier: 1.2,
      maxEnemiesMultiplier: 1.2,
      allowedEnemyIds: config.enemies.map((e) => e.id),
    };
    setConfig((prev) => ({
      ...prev,
      stages: [...prev.stages, newStage],
    }));
    setSelectedStageIdx(config.stages.length);
  };

  const handleDeleteStage = (stageId: string) => {
    if (config.stages.length <= 1) {
      alert('至少需要保留一個關卡！');
      return;
    }
    if (window.confirm('確定要刪除此關卡嗎？')) {
      setConfig((prev) => ({
        ...prev,
        stages: prev.stages.filter((s) => s.id !== stageId),
      }));
      setSelectedStageIdx(0);
    }
  };

  // --- ENEMY ACTIONS (USER REQUEST: 增多 ENEMIES / BOSS 功能) ---
  const handleAddNewEnemy = (isBoss: boolean = false) => {
    const newId = `custom_enemy_${Date.now()}`;
    const newEnemy: EnemyCustomConfig = {
      id: newId,
      name: isBoss ? '新自訂魔王 (Custom Boss)' : '新自訂妖魔 (Custom Mob)',
      type: isBoss ? 'boss' : 'swarmer',
      emoji: isBoss ? '👿' : '👾',
      customImageUrl: '',
      color: isBoss ? '#dc2626' : '#a855f7',
      hp: isBoss ? 800 : 40,
      speed: isBoss ? 50 : 80,
      radius: isBoss ? 30 : 14,
      damage: isBoss ? 24 : 10,
      exp: isBoss ? 50 : 3,
      enabled: true,
    };
    setConfig((prev) => ({
      ...prev,
      enemies: [...prev.enemies, newEnemy],
      // Also add to current stage allowed list
      stages: prev.stages.map((s) => ({
        ...s,
        allowedEnemyIds: [...s.allowedEnemyIds, newId],
      })),
    }));
  };

  const handleDeleteEnemy = (enemyId: string) => {
    if (config.enemies.length <= 1) {
      alert('至少需要保留一隻魔物！');
      return;
    }
    if (window.confirm('確定要刪除這隻魔物嗎？')) {
      setConfig((prev) => ({
        ...prev,
        enemies: prev.enemies.filter((e) => e.id !== enemyId),
      }));
    }
  };

  // --- PERK ACTIONS ---
  const handleAddNewPerk = () => {
    const newPerk: PerkCustomConfig = {
      id: `custom_perk_${Date.now()}`,
      name: '新自訂神術 (Custom Skill)',
      category: 'weapon',
      tier: 'epic',
      emoji: '✨',
      desc: '自訂的強力神術效果',
      maxLevel: 4,
      damageBonus: 15,
      projCountBonus: 1,
    };
    setConfig((prev) => ({
      ...prev,
      perks: [...prev.perks, newPerk],
    }));
  };

  const handleDeletePerk = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      perks: prev.perks.filter((p) => p.id !== id),
    }));
  };

  // --- HERO CLASS ACTIONS (USER REQUEST: 設計模式加入其他職業) ---
  const handleAddNewHeroClass = () => {
    const newId = `custom_hero_${Date.now()}`;
    const nextNum = config.heroClasses.length + 1;
    const newHero: HeroClass = {
      id: newId,
      name: `自訂神職 ${nextNum}`,
      title: '神境隱士 · 破魔導師',
      category: 'custom',
      emoji: '☯️',
      avatarUrl: '',
      desc: '擅長陰陽八卦與神祕古武，能隨意操控天地元素，具備高機動力與爆發神力。',
      initialHp: 120,
      initialSpeed: 175,
      baseDamage: 22,
      attackSpeed: 1.0,
      critRate: 0.15,
      critMultiplier: 1.8,
      magnetRange: 125,
      damageReduction: 0.1,
      initialWeapon: 'holy_dagger',
      promotion: {
        promotedName: '陰陽神皇',
        promotedTitle: '萬法歸一 · 陰陽神皇',
        promotedEmoji: '👑',
        requiredPerkId: 'holy_dagger',
        requiredPerkLevel: 3,
        secondaryPerkId: 'thunder_strike',
        secondaryPerkLevel: 1,
        bonusDamage: 25,
        bonusSpeed: 30,
        bonusHp: 60,
        auraColor: '#a855f7',
        description: '破邪靈劍 Lv.3 + 天雷招來 Lv.1 達成時覺醒神威，獲得至尊仙神靈環！',
      },
    };
    setConfig((prev) => ({
      ...prev,
      heroClasses: [...prev.heroClasses, newHero],
    }));
    setSelectedHeroIdx(config.heroClasses.length);
  };

  const handleDeleteHeroClass = (heroId: string) => {
    if (config.heroClasses.length <= 1) {
      alert('至少需要保留一個英雄職業！');
      return;
    }
    if (window.confirm('確定要刪除此英雄職業嗎？')) {
      setConfig((prev) => ({
        ...prev,
        heroClasses: prev.heroClasses.filter((h) => h.id !== heroId),
      }));
      setSelectedHeroIdx(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border-2 border-amber-400/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-amber-400/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-300 via-rose-300 to-sky-300 bg-clip-text text-transparent">
                遊戲設計工坊 · DESIGN STUDIO
              </h2>
              <p className="text-[10px] text-slate-400">
                關卡設定 · 多職業主角 · 魔物與 BOSS 自由增修 · 技能庫 · 通行碼安全
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="恢復預設"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">恢復預設</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('stages')}
            className={`flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'stages'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>關卡設定 (Stages · {config.stages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('enemies')}
            className={`flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'enemies'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>魔物與 BOSS (Enemies · {config.enemies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hero_classes')}
            className={`flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'hero_classes'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>主角職業 (Heroes · {config.heroClasses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('perks')}
            className={`flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'perks'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>技能庫 (Perks · {config.perks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sprites')}
            className={`flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'sprites'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>靈魂造型庫 (Sprites · {config.sprites?.length || DEFAULT_SPRITE_LIBRARY.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'security'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>通行證 (Passkey)</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'json'
                ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯入 / 匯出 (JSON)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: 關卡與波次設定 (Stages) */}
          {activeTab === 'stages' && (
            <div className="space-y-5">
              {/* Stage Selector Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {config.stages.map((stg, sIdx) => (
                    <button
                      key={stg.id}
                      onClick={() => setSelectedStageIdx(sIdx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        selectedStageIdx === sIdx
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span>第{stg.stageNumber || sIdx + 1}關</span>
                      {selectedStageIdx === sIdx && (
                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddNewStage}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增關卡</span>
                  </button>
                  {config.stages.length > 1 && (
                    <button
                      onClick={() => handleDeleteStage(currentStage.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 cursor-pointer transition"
                      title="刪除此關卡"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Current Stage Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-amber-300 block">
                    關卡標題 (Stage Title)
                  </label>
                  <input
                    type="text"
                    value={currentStage.title}
                    onChange={(e) => {
                      const updated = [...config.stages];
                      updated[selectedStageIdx].title = e.target.value;
                      setConfig({ ...config, stages: updated });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    placeholder="副標題 (Subtitle)"
                    value={currentStage.subtitle}
                    onChange={(e) => {
                      const updated = [...config.stages];
                      updated[selectedStageIdx].subtitle = e.target.value;
                      setConfig({ ...config, stages: updated });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-400"
                  />
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-300">
                      生存時長 (Survival Time)
                    </label>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {currentStage.survivalTime} 秒
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="180"
                    step="5"
                    value={currentStage.survivalTime}
                    onChange={(e) => {
                      const updated = [...config.stages];
                      updated[selectedStageIdx].survivalTime = Number(e.target.value);
                      setConfig({ ...config, stages: updated });
                    }}
                    className="w-full accent-amber-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>30秒 (極速)</span>
                    <span>60秒 (標準)</span>
                    <span>180秒 (極限死守)</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-300">
                      BOSS 魔王降臨時間點 (Boss Wave Time)
                    </label>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      第 {currentStage.bossWaveTime} 秒
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max={currentStage.survivalTime - 5}
                    step="5"
                    value={currentStage.bossWaveTime}
                    onChange={(e) => {
                      const updated = [...config.stages];
                      updated[selectedStageIdx].bossWaveTime = Number(e.target.value);
                      setConfig({ ...config, stages: updated });
                    }}
                    className="w-full accent-rose-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    到達此秒數時，終極 BOSS 與百鬼群獸將傾巢而出
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-300">
                      魔物刷新倍率 (Spawn Rate Multiplier)
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      x{currentStage.spawnRateMultiplier.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={currentStage.spawnRateMultiplier}
                    onChange={(e) => {
                      const updated = [...config.stages];
                      updated[selectedStageIdx].spawnRateMultiplier = Number(e.target.value);
                      setConfig({ ...config, stages: updated });
                    }}
                    className="w-full accent-amber-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0.5x (休閒)</span>
                    <span>1.0x (標準)</span>
                    <span>2.5x (狂暴怪海)</span>
                  </div>
                </div>
              </div>

              {/* Stage Background Preset & Ambient */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-amber-300 block">
                  關卡背景地圖 (Background Preset)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'sakura_shrine', title: '🌸 神秘櫻花石庭', img: PRESET_BACKGROUND_IMAGES.sakura_shrine },
                    { id: 'crystal_forest', title: '🌲 幽夜紫晶深林', img: PRESET_BACKGROUND_IMAGES.crystal_forest },
                    { id: 'volcano_ruins', title: '🌋 灼熱熔岩煉獄', img: PRESET_BACKGROUND_IMAGES.volcano_ruins },
                  ].map((bg) => (
                    <div
                      key={bg.id}
                      onClick={() => {
                        const updated = [...config.stages];
                        updated[selectedStageIdx].backgroundPreset = bg.id as CampaignStage['backgroundPreset'];
                        setConfig({ ...config, stages: updated });
                      }}
                      className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                        currentStage.backgroundPreset === bg.id
                          ? 'border-amber-400 shadow-lg shadow-amber-400/20 scale-[1.02]'
                          : 'border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={bg.img} alt={bg.title} className="w-full h-24 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-2">
                        <span className="text-xs font-bold text-amber-200">{bg.title}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ambient Particles */}
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-400 block mb-2">
                    關卡環境氛圍粒子
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'sakura', label: '🌸 浪漫落櫻' },
                      { id: 'ember', label: '🔥 業火灰燼' },
                      { id: 'stardust', label: '✨ 蒼穹星塵' },
                      { id: 'snow', label: '❄️ 靜寂落雪' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const updated = [...config.stages];
                          updated[selectedStageIdx].ambientParticle = p.id as CampaignStage['ambientParticle'];
                          setConfig({ ...config, stages: updated });
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          currentStage.ambientParticle === p.id
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 魔物與 BOSS 工坊 (USER REQUEST: 增多 ENEMIES/BOSS 功能) */}
          {activeTab === 'enemies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-amber-300">
                    魔物與 BOSS 列表庫 (共 {config.enemies.length} 種)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    自由新增全新魔物或終極 BOSS，支援自訂圖示 Emoji、血量、速度、攻擊力與碰撞尺寸
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddNewEnemy(false)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>➕ 新增魔物 (Mob)</span>
                  </button>
                  <button
                    onClick={() => handleAddNewEnemy(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-lg shadow-rose-900/40 cursor-pointer transition border border-rose-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>👑 新增 BOSS 魔王</span>
                  </button>
                </div>
              </div>

              {/* Enemy Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {config.enemies.map((enemy, idx) => (
                  <div
                    key={enemy.id}
                    className={`p-4 rounded-2xl border space-y-3 relative ${
                      enemy.type === 'boss'
                        ? 'bg-gradient-to-b from-rose-950/60 to-slate-950 border-rose-500/80 shadow-lg shadow-rose-950'
                        : enemy.type === 'elite'
                        ? 'bg-gradient-to-b from-amber-950/50 to-slate-950 border-amber-500/70 shadow'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    {/* Header Row: Emoji + Name + Type Select + Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          value={enemy.emoji}
                          onChange={(e) => {
                            const updated = [...config.enemies];
                            updated[idx].emoji = e.target.value;
                            setConfig({ ...config, enemies: updated });
                          }}
                          className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl shrink-0"
                          title="修改 Emoji"
                        />
                        <input
                          type="text"
                          value={enemy.name}
                          onChange={(e) => {
                            const updated = [...config.enemies];
                            updated[idx].name = e.target.value;
                            setConfig({ ...config, enemies: updated });
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-sm font-bold text-amber-300 w-full"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={enemy.type}
                          onChange={(e) => {
                            const updated = [...config.enemies];
                            updated[idx].type = e.target.value as EnemyCustomConfig['type'];
                            setConfig({ ...config, enemies: updated });
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-amber-200 px-2 py-1"
                        >
                          <option value="swarmer">小卒 (Swarmer)</option>
                          <option value="dasher">疾風 (Dasher)</option>
                          <option value="archer">弓手 (Archer)</option>
                          <option value="chaser">魅影 (Chaser)</option>
                          <option value="spider">🕷️ 毒瘴蛛魔 (Spider)</option>
                          <option value="ghost">👻 幽冥女妖 (Ghost)</option>
                          <option value="flame_spirit">👺 烈焰精靈 (Flame Imp)</option>
                          <option value="golem">🗿 狂暴泰坦 (Golem)</option>
                          <option value="lich">🔮 幽冥巫妖 (Lich)</option>
                          <option value="elite">精銳 (Elite)</option>
                          <option value="boss">👑 魔王 (Boss)</option>
                          <option value="nine_tails">🦊 九尾狐妖王 (Nine Tails)</option>
                        </select>

                        <button
                          onClick={() => handleDeleteEnemy(enemy.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
                          title="刪除魔物"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Numeric Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block">生命 (HP)</label>
                        <input
                          type="number"
                          value={enemy.hp}
                          onChange={(e) => {
                            const updated = [...config.enemies];
                            updated[idx].hp = Math.max(1, Number(e.target.value));
                            setConfig({ ...config, enemies: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block">速度 (Speed)</label>
                        <input
                          type="number"
                          value={enemy.speed}
                          onChange={(e) => {
                            const updated = [...config.enemies];
                            updated[idx].speed = Math.max(10, Number(e.target.value));
                            setConfig({ ...config, enemies: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block">傷害 (Dmg)</label>
                        <input
                          type="number"
                          value={enemy.damage}
                          onChange={(e) => {
                            const updated = [...config.enemies];
                            updated[idx].damage = Math.max(1, Number(e.target.value));
                            setConfig({ ...config, enemies: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-rose-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block">半徑 (Radius)</label>
                        <input
                          type="number"
                          value={enemy.radius}
                          onChange={(e) => {
                            const updated = [...config.enemies];
                            updated[idx].radius = Math.max(6, Number(e.target.value));
                            setConfig({ ...config, enemies: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-400 font-mono"
                        />
                      </div>
                    </div>

                    {/* Sprite Selection Widget */}
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        {(() => {
                          const currentSprite = getSpriteById(config.sprites, enemy.spriteId);
                          return (
                            <>
                              <SpriteCanvasPreview
                                sprite={currentSprite}
                                width={44}
                                height={44}
                                size={28}
                                autoWalk={true}
                              />
                              <div className="min-w-0 text-[11px]">
                                <span className="text-slate-400 block text-[10px]">動態 Sprite:</span>
                                <span className="font-bold text-amber-300 truncate block">{currentSprite.name}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => openSpritePickerForEnemy(idx)}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>更換造型</span>
                      </button>
                    </div>

                    {/* Custom Image URL (for Boss avatars) */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="可選頭像圖片網址 (Custom Image URL)"
                        value={enemy.customImageUrl || ''}
                        onChange={(e) => {
                          const updated = [...config.enemies];
                          updated[idx].customImageUrl = e.target.value;
                          setConfig({ ...config, enemies: updated });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder:text-slate-600"
                      />
                      <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enemy.enabled}
                          onChange={(e) => {
                            const updated = [...config.enemies];
                            updated[idx].enabled = e.target.checked;
                            setConfig({ ...config, enemies: updated });
                          }}
                          className="accent-amber-400"
                        />
                        <span>啟用</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 主角職業工坊 (Hero Classes) */}
          {activeTab === 'hero_classes' && (
            <div className="space-y-5">
              {/* Class Selector Bar & Add Custom Class Button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
                  {config.heroClasses.map((h, hIdx) => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHeroIdx(hIdx)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border shrink-0 ${
                        selectedHeroIdx === hIdx
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-base">{h.emoji}</span>
                      <span>{h.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAddNewHeroClass}
                  className="px-3 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增自訂職業</span>
                </button>
              </div>

              {/* Class Editor */}
              <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                {/* Header Row: Emoji, Name, Title, Category, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
                    <input
                      type="text"
                      value={currentHero.emoji}
                      onChange={(e) => {
                        const updated = [...config.heroClasses];
                        updated[selectedHeroIdx].emoji = e.target.value;
                        setConfig({ ...config, heroClasses: updated });
                      }}
                      className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-xl text-center text-2xl shrink-0"
                      title="修改職業 Emoji"
                    />
                    <div className="space-y-1 flex-1">
                      <input
                        type="text"
                        value={currentHero.name}
                        onChange={(e) => {
                          const updated = [...config.heroClasses];
                          updated[selectedHeroIdx].name = e.target.value;
                          setConfig({ ...config, heroClasses: updated });
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-sm font-bold text-amber-300 w-full"
                        placeholder="職業名稱"
                      />
                      <input
                        type="text"
                        value={currentHero.title}
                        onChange={(e) => {
                          const updated = [...config.heroClasses];
                          updated[selectedHeroIdx].title = e.target.value;
                          setConfig({ ...config, heroClasses: updated });
                        }}
                        className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-400 w-full"
                        placeholder="職業稱號"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={currentHero.category}
                      onChange={(e) => {
                        const updated = [...config.heroClasses];
                        updated[selectedHeroIdx].category = e.target.value as HeroClass['category'];
                        setConfig({ ...config, heroClasses: updated });
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-sky-300"
                    >
                      <option value="mage">🔮 魔法系 (Mage)</option>
                      <option value="ronin">⚔️ 浪人系 (Ronin)</option>
                      <option value="ranger">🏹 射手系 (Ranger)</option>
                      <option value="paladin">🛡️ 聖殿系 (Paladin)</option>
                      <option value="custom">☯️ 自訂神武系 (Custom)</option>
                    </select>

                    <button
                      onClick={() => handleDeleteHeroClass(currentHero.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-rose-900/80 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
                      title="刪除職業"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <input
                  type="text"
                  value={currentHero.desc}
                  onChange={(e) => {
                    const updated = [...config.heroClasses];
                    updated[selectedHeroIdx].desc = e.target.value;
                    setConfig({ ...config, heroClasses: updated });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                  placeholder="職業介紹與背景故事"
                />

                {/* Hero Sprite Interactive Showcase Stage */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-2 border-amber-400/60 shadow-xl">
                  {(() => {
                    const currentSprite = getSpriteById(config.sprites, currentHero.spriteId);
                    return (
                      <>
                        <div className="flex items-center gap-3.5 min-w-[260px]">
                          {/* Live Animated Canvas Preview with 4-Direction Controls */}
                          <SpriteCanvasPreview
                            sprite={currentSprite}
                            width={96}
                            height={96}
                            size={48}
                            interactiveControls={true}
                            isPromoted={false}
                            auraColor={currentHero.promotion?.auraColor || '#facc15'}
                          />
                          <div className="space-y-1">
                            <span className="text-[10px] text-amber-400 font-black block tracking-wider uppercase">
                              ★ 戰鬥行走 Sprite 即時預覽 (LIVE PREVIEW) ★
                            </span>
                            <h4 className="font-black text-amber-300 text-sm">{currentSprite.name}</h4>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600/50 font-mono">
                                體型: {currentSprite.shape}
                              </span>
                              {currentSprite.weaponEmoji && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                                  武器: {currentSprite.weaponEmoji}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 max-w-xs">{currentSprite.desc || '具有專屬 4 方向行走循環、法袍頭飾與武器動作。'}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openSpritePickerForHero(selectedHeroIdx)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0 cursor-pointer border border-yellow-200"
                        >
                          <Sparkles className="w-4 h-4 fill-slate-950" />
                          <span>選擇角色造型 Sprite</span>
                        </button>
                      </>
                    );
                  })()}
                </div>

                {/* Numeric Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block">初始生命 (HP)</label>
                    <input
                      type="number"
                      value={currentHero.initialHp}
                      onChange={(e) => {
                        const updated = [...config.heroClasses];
                        updated[selectedHeroIdx].initialHp = Math.max(10, Number(e.target.value));
                        setConfig({ ...config, heroClasses: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block">移動速度 (Speed)</label>
                    <input
                      type="number"
                      value={currentHero.initialSpeed}
                      onChange={(e) => {
                        const updated = [...config.heroClasses];
                        updated[selectedHeroIdx].initialSpeed = Math.max(50, Number(e.target.value));
                        setConfig({ ...config, heroClasses: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block">基礎攻擊力 (Damage)</label>
                    <input
                      type="number"
                      value={currentHero.baseDamage}
                      onChange={(e) => {
                        const updated = [...config.heroClasses];
                        updated[selectedHeroIdx].baseDamage = Math.max(1, Number(e.target.value));
                        setConfig({ ...config, heroClasses: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block">暴擊率 (Crit Rate %)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={currentHero.critRate}
                      onChange={(e) => {
                        const updated = [...config.heroClasses];
                        updated[selectedHeroIdx].critRate = Math.max(0, Math.min(1, Number(e.target.value)));
                        setConfig({ ...config, heroClasses: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block">磁鐵拾取半徑</label>
                    <input
                      type="number"
                      value={currentHero.magnetRange}
                      onChange={(e) => {
                        const updated = [...config.heroClasses];
                        updated[selectedHeroIdx].magnetRange = Math.max(30, Number(e.target.value));
                        setConfig({ ...config, heroClasses: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block">傷害減免 (Armor %)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={currentHero.damageReduction}
                      onChange={(e) => {
                        const updated = [...config.heroClasses];
                        updated[selectedHeroIdx].damageReduction = Math.max(0, Math.min(0.8, Number(e.target.value)));
                        setConfig({ ...config, heroClasses: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block">初始開局武器</label>
                    <select
                      value={currentHero.initialWeapon}
                      onChange={(e) => {
                        const updated = [...config.heroClasses];
                        updated[selectedHeroIdx].initialWeapon = e.target.value as HeroClass['initialWeapon'];
                        setConfig({ ...config, heroClasses: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                    >
                      <option value="holy_dagger">🗡️ 破邪靈劍</option>
                      <option value="giant_cleave">🪓 巨靈斬擊</option>
                      <option value="orbital_bible">📖 神聖法典</option>
                      <option value="rapid_wand">🪄 神速術杖</option>
                    </select>
                  </div>
                </div>

                {/* USER REQUEST: 特定技能儲夠數量可以轉職嗎? -> Promotion / Evolution Settings Panel */}
                <div className="mt-4 pt-4 border-t border-amber-400/30 bg-gradient-to-b from-indigo-950/40 to-slate-950 p-3.5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h5 className="text-xs font-black text-amber-300 tracking-wide">
                        神威覺醒 · 轉職進化設定 (Class Promotion & Awakening)
                      </h5>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      局中技能達到條件時即刻觸發轉職動畫與全能力飛昇
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block">轉職後稱號</label>
                      <input
                        type="text"
                        value={currentHero.promotion?.promotedTitle || ''}
                        onChange={(e) => {
                          const updated = [...config.heroClasses];
                          if (!updated[selectedHeroIdx].promotion) {
                            updated[selectedHeroIdx].promotion = {
                              promotedName: '覺醒聖皇',
                              promotedTitle: e.target.value,
                              promotedEmoji: '👑',
                              requiredPerkId: 'holy_dagger',
                              requiredPerkLevel: 3,
                              bonusDamage: 25,
                              bonusSpeed: 25,
                              bonusHp: 50,
                              auraColor: '#facc15',
                              description: '',
                            };
                          } else {
                            updated[selectedHeroIdx].promotion!.promotedTitle = e.target.value;
                          }
                          setConfig({ ...config, heroClasses: updated });
                        }}
                        placeholder="例：天界大魔導神皇"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block">轉職後角色名 & Emoji</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={currentHero.promotion?.promotedEmoji || '👑'}
                          onChange={(e) => {
                            const updated = [...config.heroClasses];
                            if (updated[selectedHeroIdx].promotion) {
                              updated[selectedHeroIdx].promotion!.promotedEmoji = e.target.value;
                              setConfig({ ...config, heroClasses: updated });
                            }
                          }}
                          className="w-8 h-7 bg-slate-900 border border-slate-700 rounded text-center text-sm"
                        />
                        <input
                          type="text"
                          value={currentHero.promotion?.promotedName || ''}
                          onChange={(e) => {
                            const updated = [...config.heroClasses];
                            if (updated[selectedHeroIdx].promotion) {
                              updated[selectedHeroIdx].promotion!.promotedName = e.target.value;
                              setConfig({ ...config, heroClasses: updated });
                            }
                          }}
                          placeholder="例：聖光神皇"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block">轉職光環色調</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={currentHero.promotion?.auraColor || '#facc15'}
                          onChange={(e) => {
                            const updated = [...config.heroClasses];
                            if (updated[selectedHeroIdx].promotion) {
                              updated[selectedHeroIdx].promotion!.auraColor = e.target.value;
                              setConfig({ ...config, heroClasses: updated });
                            }
                          }}
                          className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <span className="text-[11px] font-mono text-slate-300">
                          {currentHero.promotion?.auraColor || '#facc15'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Promotion Skill Requirements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <label className="text-[10px] text-amber-300 font-bold block">
                        核心技能條件 (必須累積等級)
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={currentHero.promotion?.requiredPerkId || 'holy_dagger'}
                          onChange={(e) => {
                            const updated = [...config.heroClasses];
                            if (updated[selectedHeroIdx].promotion) {
                              updated[selectedHeroIdx].promotion!.requiredPerkId = e.target.value;
                              setConfig({ ...config, heroClasses: updated });
                            }
                          }}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        >
                          {config.perks.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.emoji} {p.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Lv.</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={currentHero.promotion?.requiredPerkLevel || 3}
                            onChange={(e) => {
                              const updated = [...config.heroClasses];
                              if (updated[selectedHeroIdx].promotion) {
                                updated[selectedHeroIdx].promotion!.requiredPerkLevel = Math.max(1, Number(e.target.value));
                                setConfig({ ...config, heroClasses: updated });
                              }
                            }}
                            className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-amber-300 text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-sky-300 font-bold block">
                        輔助技能條件 (可選累積等級)
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={currentHero.promotion?.secondaryPerkId || ''}
                          onChange={(e) => {
                            const updated = [...config.heroClasses];
                            if (updated[selectedHeroIdx].promotion) {
                              updated[selectedHeroIdx].promotion!.secondaryPerkId = e.target.value || undefined;
                              setConfig({ ...config, heroClasses: updated });
                            }
                          }}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        >
                          <option value="">(無額外技能要求)</option>
                          {config.perks.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.emoji} {p.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Lv.</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={currentHero.promotion?.secondaryPerkLevel || 1}
                            onChange={(e) => {
                              const updated = [...config.heroClasses];
                              if (updated[selectedHeroIdx].promotion) {
                                updated[selectedHeroIdx].promotion!.secondaryPerkLevel = Math.max(1, Number(e.target.value));
                                setConfig({ ...config, heroClasses: updated });
                              }
                            }}
                            className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-sky-300 text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bonus Stats on Promotion */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block">轉職攻擊加成 (+Dmg)</label>
                      <input
                        type="number"
                        value={currentHero.promotion?.bonusDamage ?? 20}
                        onChange={(e) => {
                          const updated = [...config.heroClasses];
                          if (updated[selectedHeroIdx].promotion) {
                            updated[selectedHeroIdx].promotion!.bonusDamage = Number(e.target.value);
                            setConfig({ ...config, heroClasses: updated });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-rose-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block">轉職速度加成 (+Speed)</label>
                      <input
                        type="number"
                        value={currentHero.promotion?.bonusSpeed ?? 20}
                        onChange={(e) => {
                          const updated = [...config.heroClasses];
                          if (updated[selectedHeroIdx].promotion) {
                            updated[selectedHeroIdx].promotion!.bonusSpeed = Number(e.target.value);
                            setConfig({ ...config, heroClasses: updated });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block">轉職生命加成 (+HP)</label>
                      <input
                        type="number"
                        value={currentHero.promotion?.bonusHp ?? 50}
                        onChange={(e) => {
                          const updated = [...config.heroClasses];
                          if (updated[selectedHeroIdx].promotion) {
                            updated[selectedHeroIdx].promotion!.bonusHp = Number(e.target.value);
                            setConfig({ ...config, heroClasses: updated });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 技能庫 (Perks) */}
          {activeTab === 'perks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-300">
                  三選一升級秘技庫 (Perks · 共 {config.perks.length} 項)
                </h3>
                <button
                  onClick={handleAddNewPerk}
                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增自訂秘技</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {config.perks.map((perk, idx) => (
                  <div
                    key={perk.id}
                    className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={perk.emoji}
                          onChange={(e) => {
                            const newPerks = [...config.perks];
                            newPerks[idx].emoji = e.target.value;
                            setConfig({ ...config, perks: newPerks });
                          }}
                          className="w-10 bg-slate-900 border border-slate-700 rounded text-center text-sm"
                        />
                        <input
                          type="text"
                          value={perk.name}
                          onChange={(e) => {
                            const newPerks = [...config.perks];
                            newPerks[idx].name = e.target.value;
                            setConfig({ ...config, perks: newPerks });
                          }}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-bold text-white w-44"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <select
                          value={perk.tier}
                          onChange={(e) => {
                            const newPerks = [...config.perks];
                            newPerks[idx].tier = e.target.value as PerkCustomConfig['tier'];
                            setConfig({ ...config, perks: newPerks });
                          }}
                          className="bg-slate-900 border border-slate-700 rounded text-[10px] px-1.5 py-0.5 font-bold text-amber-300"
                        >
                          <option value="common">★ R</option>
                          <option value="rare">★★ SR</option>
                          <option value="epic">★★★ SSR</option>
                        </select>
                        <button
                          onClick={() => handleDeletePerk(perk.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="刪除秘技"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={perk.desc}
                      onChange={(e) => {
                        const newPerks = [...config.perks];
                        newPerks[idx].desc = e.target.value;
                        setConfig({ ...config, perks: newPerks });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 靈魂造型 Sprite 庫 (Sprite Library) */}
          {activeTab === 'sprites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>靈魂造型 Sprite 庫 (Sprite Library · 共 {(config.sprites || DEFAULT_SPRITE_LIBRARY).length} 款)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    預設提供 32 款日系奇幻主角、妖魔與 BOSS 造型。支援 4 方向行走步態、武器揮舞、法袍頭飾與神聖光環，亦可隨時新增專屬 Sprite！
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateSpriteOpen(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>➕ 新增自訂 Sprite</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetSpritesToDefault}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition"
                    title="恢復預設 32 款經典造型"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>重置預設庫</span>
                  </button>
                </div>
              </div>

              {/* Category Filter & Search */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSpriteFilterCategory('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      spriteFilterCategory === 'all'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    全部 ({(config.sprites || DEFAULT_SPRITE_LIBRARY).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpriteFilterCategory('hero')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      spriteFilterCategory === 'hero'
                        ? 'bg-sky-500 text-slate-950 shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    英雄神將 ({(config.sprites || DEFAULT_SPRITE_LIBRARY).filter((s) => s.category === 'hero').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpriteFilterCategory('monster')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      spriteFilterCategory === 'monster'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    一般妖魔 ({(config.sprites || DEFAULT_SPRITE_LIBRARY).filter((s) => s.category === 'monster').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpriteFilterCategory('boss')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      spriteFilterCategory === 'boss'
                        ? 'bg-rose-500 text-slate-950 shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    魔王 BOSS ({(config.sprites || DEFAULT_SPRITE_LIBRARY).filter((s) => s.category === 'boss').length})
                  </button>
                </div>

                <div className="relative min-w-[200px] flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={spriteSearchQuery}
                    onChange={(e) => setSpriteSearchQuery(e.target.value)}
                    placeholder="搜尋造型名稱、標籤或外觀..."
                    className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Create Custom Sprite Form Modal */}
              {isCreateSpriteOpen && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-amber-400/80 space-y-3.5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>✨ 打造全新靈魂造型 Sprite (New Custom Sprite)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsCreateSpriteOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center p-3 rounded-xl bg-slate-950/90 border border-amber-400/50">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-amber-300 font-bold mb-1">即時動態預覽 (Live Walk)</span>
                      <SpriteCanvasPreview
                        sprite={{
                          id: 'preview_temp',
                          name: newSpriteName || '自訂造型預覽',
                          category: newSpriteCategory,
                          emoji: newSpriteEmoji || '✨',
                          shape: newSpriteShape,
                          primaryColor: newSpritePrimaryColor,
                          secondaryColor: newSpriteSecondaryColor,
                          accentColor: newSpriteAccentColor,
                          weaponEmoji: newSpriteWeaponEmoji,
                          customImageUrl: newSpriteCustomImageUrl,
                        }}
                        width={100}
                        height={100}
                        size={50}
                        interactiveControls={true}
                      />
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <h5 className="font-black text-amber-300 text-sm">{newSpriteName || '新造型名稱...'}</h5>
                      <p className="text-[11px] text-slate-400">
                        在此可一邊微調體型、色彩與武器，一邊即時檢視 4 方向行走循環效果。
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">造型名稱 (Name)</label>
                      <input
                        type="text"
                        value={newSpriteName}
                        onChange={(e) => setNewSpriteName(e.target.value)}
                        placeholder="例: 蒼藍龍神將・席格"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">分類 (Category)</label>
                      <select
                        value={newSpriteCategory}
                        onChange={(e) => setNewSpriteCategory(e.target.value as SpriteCategory)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-bold"
                      >
                        <option value="hero">🛡️ 英雄主角 (Hero)</option>
                        <option value="monster">👾 一般妖魔 (Monster)</option>
                        <option value="boss">👑 魔王 (Boss)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">基礎體型 (Body Shape)</label>
                      <select
                        value={newSpriteShape}
                        onChange={(e) => setNewSpriteShape(e.target.value as BodyShape)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-bold"
                      >
                        <option value="humanoid">標準人型 (Humanoid)</option>
                        <option value="mage_robe">大魔導袍 (Mage Robe)</option>
                        <option value="samurai">浪人劍豪 (Samurai / Ronin)</option>
                        <option value="archer">精靈射手 (Elven Archer)</option>
                        <option value="knight">聖殿騎士 (Holy Knight)</option>
                        <option value="onmyoji">陰陽道袍 (Onmyoji)</option>
                        <option value="ninja">影之暗部 (Shinobi Ninja)</option>
                        <option value="monk">剛體武僧 (Monk)</option>
                        <option value="valkyrie">蒼穹女武神 (Valkyrie)</option>
                        <option value="gunner">魔導銃士 (Gunner)</option>
                        <option value="miko">神社巫女 (Miko)</option>
                        <option value="dragon_knight">龍血狂戰 (Dragon Knight)</option>
                        <option value="slime">彈跳軟泥 (Slime)</option>
                        <option value="bat">疾風夜蝠 (Bat)</option>
                        <option value="skeleton">白骨步兵 (Skeleton)</option>
                        <option value="spider">毒瘴巨蛛 (Spider)</option>
                        <option value="ghost">幽冥女妖 (Ghost)</option>
                        <option value="imp">烈焰小鬼 (Imp)</option>
                        <option value="wolf">暗夜嗜血狼 (Wolf)</option>
                        <option value="golem">古代巨岩泰坦 (Golem)</option>
                        <option value="lich">天冥巫妖 (Lich)</option>
                        <option value="oni">赤鬼羅剎 (Oni)</option>
                        <option value="nine_tails">九尾天狐女王 (Nine-Tails)</option>
                        <option value="dragon">滅世漆黑邪龍 (Dragon)</option>
                        <option value="reaper">暗黑死神 (Grim Reaper)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] text-slate-400 block mb-1">象徵 Emoji</label>
                        <input
                          type="text"
                          value={newSpriteEmoji}
                          onChange={(e) => setNewSpriteEmoji(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] text-slate-400 block mb-1">武器 Emoji</label>
                        <input
                          type="text"
                          value={newSpriteWeaponEmoji}
                          onChange={(e) => setNewSpriteWeaponEmoji(e.target.value)}
                          placeholder="例: ⚔️"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-lg"
                        />
                      </div>
                    </div>

                    {/* Colors */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">主色彩 (Primary)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newSpritePrimaryColor}
                          onChange={(e) => setNewSpritePrimaryColor(e.target.value)}
                          className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={newSpritePrimaryColor}
                          onChange={(e) => setNewSpritePrimaryColor(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">副色彩 (Secondary)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newSpriteSecondaryColor}
                          onChange={(e) => setNewSpriteSecondaryColor(e.target.value)}
                          className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={newSpriteSecondaryColor}
                          onChange={(e) => setNewSpriteSecondaryColor(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">點綴亮色 (Accent)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newSpriteAccentColor}
                          onChange={(e) => setNewSpriteAccentColor(e.target.value)}
                          className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={newSpriteAccentColor}
                          onChange={(e) => setNewSpriteAccentColor(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">可選圖片網址 (Custom URL)</label>
                      <input
                        type="text"
                        value={newSpriteCustomImageUrl}
                        onChange={(e) => setNewSpriteCustomImageUrl(e.target.value)}
                        placeholder="圖片或 SVG 網址"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">搜尋標籤 (以逗號隔開)</label>
                      <input
                        type="text"
                        value={newSpriteTags}
                        onChange={(e) => setNewSpriteTags(e.target.value)}
                        placeholder="例: 龍騎士, 烈焰, 霸體"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="text-[11px] text-slate-400 block mb-1">造型描述 (Description)</label>
                      <input
                        type="text"
                        value={newSpriteDesc}
                        onChange={(e) => setNewSpriteDesc(e.target.value)}
                        placeholder="身披赤紅龍鱗重甲，雙持烈焰狂斧的異界戰神..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCreateSpriteOpen(false)}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewSprite}
                      className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg transition"
                    >
                      確認儲存至靈魂造型庫
                    </button>
                  </div>
                </div>
              )}

              {/* Sprites Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {(config.sprites || DEFAULT_SPRITE_LIBRARY)
                  .filter((s) => {
                    const matchCat = spriteFilterCategory === 'all' || s.category === spriteFilterCategory;
                    const q = spriteSearchQuery.trim().toLowerCase();
                    const matchQ =
                      !q ||
                      s.name.toLowerCase().includes(q) ||
                      s.shape.toLowerCase().includes(q) ||
                      (s.tags && s.tags.some((t) => t.toLowerCase().includes(q))) ||
                      (s.desc && s.desc.toLowerCase().includes(q));
                    return matchCat && matchQ;
                  })
                  .map((sprite) => {
                    const previewUrl = getSpriteSvgPreview(sprite);
                    const isCustom = !DEFAULT_SPRITE_LIBRARY.some((d) => d.id === sprite.id);

                    return (
                      <div
                        key={sprite.id}
                        className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-600 transition flex flex-col justify-between space-y-2.5 relative group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Live Animated Visual Avatar */}
                          <SpriteCanvasPreview
                            sprite={sprite}
                            width={56}
                            height={56}
                            size={32}
                            autoWalk={true}
                            className="shrink-0 group-hover:scale-105 transition-transform"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  sprite.category === 'hero'
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                    : sprite.category === 'boss'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {sprite.category === 'hero' ? '英雄' : sprite.category === 'boss' ? '魔王' : '魔物'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {sprite.shape}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-100 truncate mt-1">
                              {sprite.name}
                            </h4>

                            {/* Color Swatch */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-black/50"
                                style={{ backgroundColor: sprite.primaryColor }}
                                title="主色"
                              />
                              <span
                                className="w-3 h-3 rounded-full border border-black/50"
                                style={{ backgroundColor: sprite.secondaryColor }}
                                title="次色"
                              />
                              <span
                                className="w-3 h-3 rounded-full border border-black/50"
                                style={{ backgroundColor: sprite.accentColor }}
                                title="點綴色"
                              />
                            </div>
                          </div>
                        </div>

                        {sprite.desc && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {sprite.desc}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-1 flex-wrap">
                            {sprite.tags?.slice(0, 2).map((t, tidx) => (
                              <span
                                key={tidx}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-1">
                            {isCustom && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                                自訂
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteSprite(sprite.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                              title="自造型庫刪除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 5: 通行碼安全 (Security / Passkey) */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-md mx-auto py-6">
              <div className="bg-slate-950/80 p-6 rounded-3xl border border-amber-400/40 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400 mx-auto flex items-center justify-center text-amber-300 shadow">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-300">
                    設計模式安全通行碼 (Design Studio Passkey)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    防止未授權玩家任意竄改數值與關卡，進入工坊前必須輸入此密碼。
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block text-left">
                    當前通行證密碼 (PASSKEY)
                  </label>
                  <input
                    type="text"
                    value={config.passkey}
                    onChange={(e) => setConfig({ ...config, passkey: e.target.value })}
                    className="w-full bg-slate-900 border-2 border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-amber-300 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500">預設密碼為 8888，您可更換為任意自訂字元。</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: 匯入 / 匯出 JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  將完整自訂配置（包含所有關卡、主角職業與動態魔物）匯出為 JSON，或直接貼上朋友分享的配置：
                </span>
                <button
                  onClick={handleExportJson}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{copiedNotification ? '已複製到剪貼簿！' : '一鍵複製導出 JSON'}</span>
                </button>
              </div>

              <textarea
                rows={12}
                value={jsonInput || exportConfigJson(config)}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="貼上遊戲設定 JSON 於此..."
                className="w-full bg-slate-950 font-mono text-xs text-sky-200 p-3.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-amber-400"
              />

              {jsonError && (
                <div className="text-xs text-rose-400 bg-rose-950/60 p-2.5 rounded-xl border border-rose-800">
                  {jsonError}
                </div>
              )}

              <button
                onClick={handleImportJson}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>立即匯入上方 JSON 配置</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            取消關閉
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存配置</span>
            </button>

            <button
              onClick={handleTestPlay}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer border border-yellow-200"
            >
              <Play className="w-4 h-4 fill-current text-slate-950" />
              <span>保存並立即試玩 (APPLY & PLAY)</span>
            </button>
          </div>
        </div>

        {/* Universal Sprite Picker Modal */}
        <SpritePickerModal
          isOpen={spritePickerOpen}
          onClose={() => setSpritePickerOpen(false)}
          sprites={config.sprites || DEFAULT_SPRITE_LIBRARY}
          title={
            spritePickerTarget?.type === 'hero'
              ? '為主角選擇 Sprite 造型 (Hero Sprite)'
              : '為魔物選擇 Sprite 造型 (Enemy Sprite)'
          }
          defaultCategory={spritePickerCategory}
          selectedSpriteId={
            spritePickerTarget?.type === 'hero'
              ? config.heroClasses[spritePickerTarget.index]?.spriteId
              : spritePickerTarget?.type === 'enemy'
              ? config.enemies[spritePickerTarget.index]?.spriteId
              : undefined
          }
          onSelect={handleSelectSprite}
        />
      </div>
    </div>
  );
}
