import React, { useState, useMemo } from 'react';
import { X, Search, Check, Sparkles, Filter, Shield, Skull, Crown } from 'lucide-react';
import {
  SpriteAssetConfig,
  SpriteCategory,
  getSpriteSvgPreview,
} from '../game/spriteLibrary';
import { SpriteCanvasPreview } from './SpriteCanvasPreview';

interface SpritePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprites: SpriteAssetConfig[];
  selectedSpriteId?: string;
  title?: string;
  defaultCategory?: 'all' | SpriteCategory;
  onSelect: (sprite: SpriteAssetConfig) => void;
}

export function SpritePickerModal({
  isOpen,
  onClose,
  sprites,
  selectedSpriteId,
  title = '選擇造型 Sprite (Sprite Library)',
  defaultCategory = 'all',
  onSelect,
}: SpritePickerModalProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | SpriteCategory>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSprites = useMemo(() => {
    return sprites.filter((s) => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.shape.toLowerCase().includes(q) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(q))) ||
        (s.desc && s.desc.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [sprites, activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-amber-500/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200">
                {title}
              </h2>
              <p className="text-xs text-slate-400">
                點選造型即可立即指派 · 支援靈魂步態、武器揮舞與轉職神環
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              全部 ({sprites.length})
            </button>
            <button
              onClick={() => setActiveCategory('hero')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeCategory === 'hero'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              英雄神將 ({sprites.filter((s) => s.category === 'hero').length})
            </button>
            <button
              onClick={() => setActiveCategory('monster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeCategory === 'monster'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Skull className="w-3.5 h-3.5" />
              一般妖魔 ({sprites.filter((s) => s.category === 'monster').length})
            </button>
            <button
              onClick={() => setActiveCategory('boss')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeCategory === 'boss'
                  ? 'bg-rose-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              魔王 BOSS ({sprites.filter((s) => s.category === 'boss').length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋造型名稱、標籤或外觀..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* Sprites Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredSprites.map((sprite) => {
            const isSelected = sprite.id === selectedSpriteId;
            const previewUrl = getSpriteSvgPreview(sprite);

            return (
              <div
                key={sprite.id}
                onClick={() => {
                  onSelect(sprite);
                  onClose();
                }}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-500'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black flex items-center gap-1 shadow">
                    <Check className="w-3 h-3" /> 使用中
                  </div>
                )}

                <div className="flex items-start gap-3">
                  {/* Sprite Visual Avatar - Live Animated Canvas */}
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

                    <h3 className="text-sm font-bold text-slate-100 truncate mt-1 group-hover:text-amber-300 transition-colors">
                      {sprite.name}
                    </h3>

                    {/* Colors */}
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
                  <p className="text-[11px] text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                    {sprite.desc}
                  </p>
                )}

                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-1 flex-wrap">
                    {sprite.tags?.slice(0, 3).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-700 text-slate-200 hover:bg-amber-500 hover:text-slate-950'
                    }`}
                  >
                    {isSelected ? '已選定' : '套用此造型'}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredSprites.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">沒有找到符合條件的 Sprite 造型</p>
              <p className="text-xs text-slate-500 mt-1">
                您可以切換分類標籤，或在設計模式「靈魂造型 Sprite 庫」中新增專屬自訂造型！
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            共 {sprites.length} 款靈魂造型可供選擇 (支援英雄主角、魔物與 BOSS)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
