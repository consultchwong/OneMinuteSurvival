/**
 * 《單手求生：1分鐘倖存者》 - 一分間生存：神撃サバイバー (One-Hand Survivor: Anime Edition)
 * Authentic Japanese Anime Mobile Game UI & Visuals + 4-Directional Animated Sprite
 * + Hero Class Selection + Multi-Stage Campaign Progression + Passkey Protected Design Studio.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Tv,
  Zap,
  Sword,
  Trophy,
  Heart,
  Skull,
  Clock,
  Flame,
  Star,
  Sliders,
  ChevronRight,
  Lock,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';
import { GameEngine, LiveHudState, RunStats, SkillHudItem } from './game/engine';
import { sound } from './game/audio';
import { PerkDefinition } from './game/rules';
import { rollThreePerks } from './game/perks';
import { DesignStudioModal } from './components/DesignStudioModal';
import { PasskeyModal } from './components/PasskeyModal';
import {
  GameConfig,
  loadGameConfig,
  loadUnlockedStages,
  unlockStage,
  HeroClass,
  CampaignStage,
  HeroPromotionConfig,
} from './game/customConfig';
import { platformMonetization } from './game/platformAdapter';

interface BestStats {
  bestTime: number;
  bestKills: number;
  bestLevel: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'level_up' | 'ad_modal' | 'gameover' | 'victory'>('title');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [isPasskeyOpen, setIsPasskeyOpen] = useState<boolean>(false);
  const [isDesignStudioOpen, setIsDesignStudioOpen] = useState<boolean>(false);
  const [promotedHeroInfo, setPromotedHeroInfo] = useState<HeroPromotionConfig | null>(null);

  // Config & Stage progression
  const [currentConfig, setCurrentConfig] = useState<GameConfig>(() => loadGameConfig());
  const [unlockedStages, setUnlockedStages] = useState<string[]>(() => loadUnlockedStages());
  const [selectedHeroId, setSelectedHeroId] = useState<string>(() => loadGameConfig().selectedHeroClassId || 'mage');
  const [selectedStageId, setSelectedStageId] = useState<string>(() => loadGameConfig().currentStageId || 'stage_1');

  const [hud, setHud] = useState<LiveHudState>({
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpNeeded: 5,
    timeLeft: 60,
    kills: 0,
    phaseText: '準備完了',
  });

  const [availablePerks, setAvailablePerks] = useState<PerkDefinition[]>([]);
  const [selectedPerkIndex, setSelectedPerkIndex] = useState<number>(0);
  const [runStats, setRunStats] = useState<RunStats | null>(null);
  const [bestStats, setBestStats] = useState<BestStats>({
    bestTime: 0,
    bestKills: 0,
    bestLevel: 1,
  });

  // Simulated Ad State
  const [adContext, setAdContext] = useState<{
    type: 'revive' | 'reroll' | 'select_all';
    perkIds?: string[];
    title: string;
    countdown: number;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('onehand_survivor_best');
      if (saved) {
        setBestStats(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }

    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    (window as any).__gameEngine = engine;
    setCurrentConfig(engine.config);

    engine.onHudUpdate = (liveHud) => {
      setHud(liveHud);
    };

    engine.onPromotionPrompt = (promo) => {
      setPromotedHeroInfo(promo);
    };

    engine.onLevelUpPrompt = (perks) => {
      setAvailablePerks(perks);
      setSelectedPerkIndex(0);
      setGameState('level_up');
    };

    engine.onGameOverPrompt = (stats) => {
      setRunStats(stats);
      updateBestStats(stats);
      platformMonetization.reportGameplayStop();
      setGameState('gameover');
    };

    engine.onVictoryPrompt = (stats) => {
      setRunStats(stats);
      updateBestStats(stats);
      platformMonetization.reportGameplayStop();
      platformMonetization.reportHappyTime();

      // Unlock next stage in campaign!
      const stageIdx = engine.config.stages.findIndex((s) => s.id === engine.config.currentStageId);
      if (stageIdx !== -1 && stageIdx < engine.config.stages.length - 1) {
        const nextStage = engine.config.stages[stageIdx + 1];
        unlockStage(nextStage.id);
        setUnlockedStages(loadUnlockedStages());
      }

      setGameState('victory');
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startGame();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        const muted = sound.toggleMute();
        setIsMuted(muted);
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (engineRef.current?.state === 'playing') {
          engineRef.current.pauseGame();
          setGameState('paused');
        } else if (engineRef.current?.state === 'paused') {
          engineRef.current.resumeGame();
          setGameState('playing');
        }
      }
      if ((e.code === 'Enter' || e.code === 'Space') && engineRef.current?.state === 'title') {
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
    };
  }, []);

  const updateBestStats = (stats: RunStats) => {
    setBestStats((prev) => {
      const updated = {
        bestTime: Math.max(prev.bestTime, Math.round(stats.survivedTime)),
        bestKills: Math.max(prev.bestKills, stats.kills),
        bestLevel: Math.max(prev.bestLevel, stats.level),
      };
      try {
        localStorage.setItem('onehand_survivor_best', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const startGame = (stageIdToStart?: string, heroIdToStart?: string) => {
    if (!engineRef.current) return;
    const sId = stageIdToStart || selectedStageId;
    const hId = heroIdToStart || selectedHeroId;
    setSelectedStageId(sId);
    setSelectedHeroId(hId);
    setPromotedHeroInfo(null);
    setGameState('playing');
    platformMonetization.reportGameplayStart();
    engineRef.current.startNewGame(sId, hId);
  };

  const handleMuteToggle = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handlePauseToggle = () => {
    if (!engineRef.current) return;
    if (gameState === 'playing') {
      engineRef.current.pauseGame();
      setGameState('paused');
    } else if (gameState === 'paused') {
      engineRef.current.resumeGame();
      setGameState('playing');
    }
  };

  const handleSelectPerk = (id: string) => {
    if (!engineRef.current) return;
    setGameState('playing');
    engineRef.current.selectPerk(id);
  };

  // Keyboard Navigation for Level-Up Perk Selection (上下方向鍵 / W S / 數字鍵 1-3 / Enter 鍵確定)
  useEffect(() => {
    if (gameState !== 'level_up') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (availablePerks.length === 0) return;

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedPerkIndex((prev) => (prev + 1) % availablePerks.length);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedPerkIndex((prev) => (prev - 1 + availablePerks.length) % availablePerks.length);
      } else if (e.key === '1' && availablePerks[0]) {
        e.preventDefault();
        handleSelectPerk(availablePerks[0].id);
      } else if (e.key === '2' && availablePerks[1]) {
        e.preventDefault();
        handleSelectPerk(availablePerks[1].id);
      } else if (e.key === '3' && availablePerks[2]) {
        e.preventDefault();
        handleSelectPerk(availablePerks[2].id);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (availablePerks[selectedPerkIndex]) {
          handleSelectPerk(availablePerks[selectedPerkIndex].id);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        triggerSimulatedAd('reroll');
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        triggerSimulatedAd('select_all', availablePerks.map((p) => p.id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, availablePerks, selectedPerkIndex]);

  const handleApplyConfig = (newConfig: GameConfig) => {
    setCurrentConfig(newConfig);
    if (engineRef.current) {
      engineRef.current.applyConfig(newConfig);
    }
    setUnlockedStages(loadUnlockedStages());
  };

  const handleTestPlayConfig = (newConfig: GameConfig) => {
    handleApplyConfig(newConfig);
    setIsDesignStudioOpen(false);
    startGame(newConfig.currentStageId, newConfig.selectedHeroClassId);
  };

  const applyAdReward = (type: 'revive' | 'reroll' | 'select_all', perkIds?: string[]) => {
    if (!engineRef.current) return;
    if (type === 'revive') {
      engineRef.current.triggerAdRevive();
      setGameState('playing');
    } else if (type === 'reroll') {
      const newPerks = rollThreePerks(engineRef.current.acquiredPerks, true, engineRef.current.config.perks);
      setAvailablePerks(newPerks);
      setSelectedPerkIndex(0);
      setGameState('level_up');
    } else if (type === 'select_all' && perkIds) {
      engineRef.current.selectAllThreePerks(perkIds);
      setGameState('playing');
    }
  };

  const triggerSimulatedAd = (type: 'revive' | 'reroll' | 'select_all', perkIds?: string[]) => {
    platformMonetization.showRewardedAd(
      () => {
        applyAdReward(type, perkIds);
      },
      () => {
        let title = '動画広告を視聴して特別報酬を獲得';
        if (type === 'revive') title = '💥 全画面消滅復活！神聖爆炎結界 + 3秒無敵！';
        if (type === 'reroll') title = '🎲 運命再選：SSR極品術式を含む無料リロール！';
        if (type === 'select_all') title = '⚡ 神威全開：三種能力を一挙に全解放獲得！';

        setAdContext({
          type,
          perkIds,
          title,
          countdown: 3,
        });
        setGameState('ad_modal');
      },
      (muted) => {
        if (muted) {
          if (!isMuted) sound.toggleMute();
        } else {
          if (isMuted) sound.toggleMute();
        }
      }
    );
  };

  useEffect(() => {
    if (gameState !== 'ad_modal' || !adContext) return;
    if (adContext.countdown <= 0) return;

    const timer = setInterval(() => {
      setAdContext((prev) => {
        if (!prev) return null;
        if (prev.countdown <= 1) {
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, adContext?.countdown]);

  const claimAdReward = () => {
    if (!adContext) return;
    const type = adContext.type;
    const perkIds = adContext.perkIds;
    setAdContext(null);
    applyAdReward(type, perkIds);
  };

  const currentStage =
    currentConfig.stages.find((s) => s.id === selectedStageId) || currentConfig.stages[0];
  const currentHero =
    currentConfig.heroClasses.find((h) => h.id === selectedHeroId) || currentConfig.heroClasses[0];

  const currentStageIdx = currentConfig.stages.findIndex((s) => s.id === currentStage.id);
  const nextStage = currentStageIdx >= 0 && currentStageIdx < currentConfig.stages.length - 1
    ? currentConfig.stages[currentStageIdx + 1]
    : null;

  const xpPercent = Math.min(100, Math.max(0, (hud.xp / (hud.xpNeeded || 1)) * 100));
  const hpPercent = Math.min(100, Math.max(0, (hud.hp / (hud.maxHp || 1)) * 100));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* 1. Underlying 60FPS Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none z-0"
      />

      {/* 2. Japanese Mobile RPG HUD Overlay (Only in 'playing' or 'paused') */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2.5 sm:p-4">
          {/* Top Status Cluster */}
          <div className="flex flex-col gap-1.5 w-full max-w-xl mx-auto">
            {/* Japanese Anime Glowing XP Bar */}
            <div className="relative w-full h-3 bg-slate-900/90 rounded-full border border-amber-400/50 overflow-hidden shadow-lg shadow-sky-950">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-300 transition-all duration-150 ease-out"
                style={{ width: `${xpPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-black tracking-widest text-white drop-shadow">
                <span>LV.{hud.level} 霊力覚醒</span>
                <span className="font-mono">{hud.xp} / {hud.xpNeeded} EXP</span>
              </div>
            </div>

            {/* Top Perimeter Cluster */}
            <div className="flex items-center justify-between text-xs font-semibold">
              {/* Anime Hero Portrait + HP Bar */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900/95 to-slate-900/80 px-2.5 py-1 rounded-xl border border-amber-400/40 shadow-md">
                <div className="relative w-8 h-8 rounded-full border-2 border-amber-400 overflow-hidden shadow shrink-0 bg-slate-800 flex items-center justify-center text-lg">
                  {currentHero.avatarUrl ? (
                    <img
                      src={currentHero.avatarUrl}
                      alt={currentHero.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    currentHero.emoji
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                    <span className="truncate max-w-[100px]">{hud.isPromoted && hud.promotedTitle ? `👑 ${hud.promotedTitle}` : currentHero.name.split('・')[0]}</span>
                    <span className="font-mono tabular-nums text-rose-300 ml-2">{hud.hp}/{hud.maxHp}</span>
                  </div>
                  <div className="w-20 sm:w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-150"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Japanese Shrine Crest Countdown Timer */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-black tracking-wider tabular-nums border-2 shadow-lg ${
                    hud.timeLeft <= 10
                      ? 'bg-rose-950/95 text-rose-300 border-rose-500 animate-bounce shadow-rose-900'
                      : 'bg-slate-900/95 text-amber-300 border-amber-400/80 shadow-amber-950'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm sm:text-base">{hud.timeLeft.toFixed(1)}s</span>
                </div>
                <div className="text-[10px] font-bold text-amber-200 mt-0.5 bg-slate-950/70 px-2 py-0.5 rounded-full border border-slate-800">
                  {hud.phaseText}
                </div>
              </div>

              {/* Kills & Quick Utility Buttons */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-purple-500/50 shadow">
                  <Sword className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-purple-200 tabular-nums">
                    {hud.kills} 討伐
                  </span>
                </div>

                <div className="pointer-events-auto flex items-center gap-1">
                  <button
                    onClick={handleMuteToggle}
                    className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-amber-400/30 text-amber-200 shadow cursor-pointer transition"
                    title="音量開關 [M]"
                    aria-label="音量開關"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handlePauseToggle}
                    className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-amber-400/30 text-amber-200 shadow cursor-pointer transition"
                    title="一時停止 [P]"
                    aria-label="一時停止"
                  >
                    {gameState === 'paused' ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Acquired Skills & Real-Time Cooldown Countdown Belt */}
            {hud.skills && hud.skills.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-2.5 rounded-2xl bg-slate-950/85 border border-amber-400/40 shadow-xl backdrop-blur-md scrollbar-none self-start max-w-full pointer-events-auto">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest shrink-0 pr-1.5 border-r border-slate-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>習得秘術</span>
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                  {hud.skills.map((skill) => {
                    const isMax = skill.level >= skill.maxLevel;
                    const onCooldown = skill.cooldownRemaining !== undefined && skill.cooldownRemaining > 0.05;
                    return (
                      <div
                        key={skill.id}
                        className={`relative flex items-center gap-1.5 px-2 py-1 rounded-xl border transition-all ${
                          skill.tier === 'epic'
                            ? 'bg-purple-950/80 border-purple-400/80 shadow-md shadow-purple-950'
                            : skill.tier === 'rare'
                            ? 'bg-sky-950/80 border-sky-400/80 shadow-md shadow-sky-950'
                            : 'bg-slate-900/90 border-slate-700/90'
                        }`}
                        title={`${skill.name} (Lv.${skill.level}/${skill.maxLevel})`}
                      >
                        {/* Skill Icon container with Cooldown sweep */}
                        <div className="relative w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center text-sm overflow-hidden shrink-0 border border-slate-700/80 shadow-inner">
                          <span>{skill.emoji}</span>

                          {/* Cooldown Dark Sweep Overlay */}
                          {onCooldown && (
                            <div
                              className="absolute inset-x-0 bottom-0 bg-slate-950/85 transition-all duration-75"
                              style={{ height: `${(1 - skill.cooldownPercent) * 100}%` }}
                            />
                          )}

                          {/* Cooldown Countdown Seconds Badge */}
                          {onCooldown && (
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-black text-amber-300 drop-shadow">
                              {skill.cooldownRemaining!.toFixed(1)}s
                            </span>
                          )}
                        </div>

                        {/* Level and Name info */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-mono font-black leading-tight ${isMax ? 'text-amber-400' : 'text-sky-300'}`}>
                              {isMax ? 'MAX' : `Lv.${skill.level}`}
                            </span>
                            {skill.category === 'weapon' && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                武器
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-200 truncate max-w-[56px] leading-tight font-bold">
                            {skill.name.split('・')[0].split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Floating Control Hint */}
          <div className="text-center text-[11px] text-amber-100/90 tracking-wide font-medium pb-2 drop-shadow">
            🌸 {currentStage.title} · 4方向移動 · 全自動攻擊 · 撐過 {currentStage.survivalTime} 秒過關！
          </div>
        </div>
      )}

      {/* 3. Japanese Anime Title Screen with Hero Class & Campaign Stage Selector */}
      {gameState === 'title' && (
        <div
          className="absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 bg-cover bg-center overflow-y-auto"
          style={{ backgroundImage: `url('/src/assets/images/anime_title_art_1794060378622.jpg')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/60 to-slate-950/90 pointer-events-none" />

          {/* Top Title Header */}
          <div className="relative z-10 text-center pt-2 sm:pt-4 flex flex-col items-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-amber-400/60 text-amber-300 text-[10px] font-bold tracking-widest uppercase shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>日系動漫割草手遊 · 闖關冒險 mode</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              一分間生存：神撃サバイバー
            </h1>
            <div className="text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-300 via-rose-300 to-sky-300 bg-clip-text text-transparent drop-shadow">
              《單手求生：1分鐘倖存者 - Anime Edition》
            </div>
          </div>

          {/* Center Selection Section */}
          <div className="relative z-10 max-w-2xl w-full mx-auto my-auto py-2 space-y-3.5">
            {/* HERO CLASS SELECTION (主角職業選擇) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>選擇主角職業 (SELECT HERO CLASS)</span>
                </span>
                <span className="text-[10px] text-slate-400">4方向行走動作 · 獨特開局武器</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentConfig.heroClasses.map((hero) => {
                  const isSelected = selectedHeroId === hero.id;
                  return (
                    <div
                      key={hero.id}
                      onClick={() => setSelectedHeroId(hero.id)}
                      className={`relative p-2.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-400/25 via-indigo-950/80 to-slate-950 border-amber-400 shadow-xl shadow-amber-400/20 scale-[1.02]'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow">
                          {hero.avatarUrl ? (
                            <img src={hero.avatarUrl} alt={hero.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            hero.emoji
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">{hero.name.split('・')[0]}</div>
                          <div className="text-[9px] font-bold text-amber-300 truncate">{hero.title.split('】')[0]}】</div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 text-[10px] text-slate-300">
                        <span>HP: {hero.initialHp}</span>
                        <span>ATK: {hero.baseDamage}</span>
                        <span>移速: {hero.initialSpeed}</span>
                        <span>暴擊: {Math.round(hero.critRate * 100)}%</span>
                      </div>

                      {hero.promotion && (
                        <div className="mt-1.5 px-1.5 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-[9px] text-amber-200 truncate font-semibold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate">轉職：{hero.promotion.promotedName}</span>
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STAGE CAMPAIGN SELECTION (過關模式關卡選擇) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>過關模式 · 關卡選擇 (CAMPAIGN STAGES)</span>
                </span>
                <span className="text-[10px] text-slate-400">打完一關自動解鎖下一關</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {currentConfig.stages.map((stg, idx) => {
                  const isUnlocked = unlockedStages.includes(stg.id);
                  const isSelected = selectedStageId === stg.id;
                  return (
                    <div
                      key={stg.id}
                      onClick={() => {
                        if (isUnlocked) setSelectedStageId(stg.id);
                      }}
                      className={`relative p-2.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        !isUnlocked
                          ? 'bg-slate-950/60 border-slate-800/50 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-gradient-to-b from-sky-950/80 via-indigo-950/90 to-slate-950 border-amber-400 shadow-xl shadow-amber-400/20 scale-[1.02] cursor-pointer'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 opacity-85 hover:opacity-100 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300">
                          STAGE {stg.stageNumber || idx + 1}
                        </span>
                        {isUnlocked ? (
                          <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>已解鎖</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-500 flex items-center gap-0.5">
                            <Lock className="w-3 h-3" />
                            <span>未解鎖</span>
                          </span>
                        )}
                      </div>

                      <div className="my-1.5">
                        <div className="text-xs font-black text-white truncate">{stg.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{stg.subtitle}</div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1.5 border-t border-slate-800/80">
                        <span>生存: {stg.survivalTime}秒</span>
                        <span className="text-rose-400">魔王: 第{stg.bossWaveTime}秒</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="w-full flex flex-col gap-2 pt-1">
              <button
                data-start="true"
                onClick={() => startGame()}
                className="w-full py-3.5 px-6 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-amber-500/30 border-2 border-yellow-200 flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Zap className="w-5 h-5 fill-current text-slate-950" />
                <span>出撃開始 · START ({currentStage.title.split('：')[0]})</span>
              </button>

              {/* DESIGN STUDIO BUTTON (Protected by Passkey) */}
              <button
                onClick={() => setIsPasskeyOpen(true)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-indigo-950/90 hover:from-indigo-900 hover:to-purple-900 border-2 border-amber-400/60 text-amber-300 text-xs sm:text-sm font-black rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition transform hover:scale-[1.01]"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>🛠️ 設計模式 (需要 PASSKEY · 自由增設關卡/魔物BOSS/主角職業)</span>
              </button>
            </div>
          </div>

          {/* Bottom Record & Hint */}
          <div className="relative z-10 text-center text-[10px] sm:text-[11px] text-slate-300 pb-1">
            <span>最高生存: <b className="text-amber-300">{bestStats.bestTime}s</b> | 最高討伐: <b className="text-purple-300">{bestStats.bestKills}隻</b> | 最高等級: <b className="text-sky-300">LV.{bestStats.bestLevel}</b></span>
            <div className="text-[10px] text-slate-400 mt-0.5">
              4 方向行走動作 · [M] 音量 · 預設通行碼: 8888
            </div>
          </div>
        </div>
      )}

      {/* 4. Japanese Anime Gacha/TCG Card Level-Up Modal */}
      {gameState === 'level_up' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85">
          <div className="max-w-lg w-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col space-y-4">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>★ LEVEL UP! 霊力覚醒 ★</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">獲得する術式・秘技を1つ選択</h2>
              <div className="text-[11px] text-amber-300/90 font-mono flex items-center justify-center gap-1.5 pt-0.5">
                <span>⌨️ 支援鍵盤：[↑ / ↓] 或 [W / S] 選擇 · [Enter] 確定 · 按 [1-3] 直接選取</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {availablePerks.map((perk, idx) => {
                const isSelected = idx === selectedPerkIndex;
                return (
                  <button
                    key={perk.id}
                    onClick={() => handleSelectPerk(perk.id)}
                    onMouseEnter={() => setSelectedPerkIndex(idx)}
                    className={`p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer transform shadow-lg relative ${
                      isSelected
                        ? 'ring-2 ring-amber-400 border-amber-300 shadow-amber-500/40 bg-gradient-to-r from-amber-500/25 via-slate-900 to-slate-900 scale-[1.02]'
                        : perk.tier === 'epic'
                        ? 'bg-gradient-to-r from-purple-950/80 to-slate-900 border-purple-400/80 hover:border-amber-300'
                        : perk.tier === 'rare'
                        ? 'bg-gradient-to-r from-sky-950/80 to-slate-900 border-sky-400/80 hover:border-amber-300'
                        : 'bg-gradient-to-r from-slate-900 to-slate-950 border-slate-600 hover:border-amber-400'
                    }`}
                  >
                    {/* Number key hotkey badge */}
                    <div className={`w-6 h-6 rounded-lg text-xs font-mono font-black flex items-center justify-center border shrink-0 ${
                      isSelected ? 'bg-amber-400 text-slate-950 border-yellow-200 shadow' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {perk.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white text-sm sm:text-base flex items-center gap-1.5">
                          <span>{perk.name}</span>
                          {isSelected && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black animate-pulse">
                              ▶ 選擇中 [Enter]
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            perk.tier === 'epic'
                              ? 'bg-purple-900/80 text-purple-200 border-purple-400'
                              : perk.tier === 'rare'
                              ? 'bg-sky-900/80 text-sky-200 border-sky-400'
                              : 'bg-slate-800 text-slate-300 border-slate-600'
                          }`}
                        >
                          {perk.tier === 'epic' ? '★★★ SSR' : perk.tier === 'rare' ? '★★ SR' : '★ R'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">{perk.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => triggerSimulatedAd('reroll')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span>[R] [広告] 運命再選：無料リロール</span>
              </button>

              <button
                onClick={() => triggerSimulatedAd('select_all', availablePerks.map((p) => p.id))}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-rose-400 border border-yellow-200 text-xs font-black text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-amber-900 transition cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 fill-current text-slate-950" />
                <span>[A] [広告] 全神解放！三種能力全獲得</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Rewarded Ad Simulation Modal */}
      {gameState === 'ad_modal' && adContext && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/90">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2 text-amber-300">
              <Tv className="w-5 h-5 animate-bounce" />
              <span className="font-black text-xs uppercase tracking-wider">スポンサー特別提供 (MOCK AD)</span>
            </div>

            <div className="w-full bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 border border-amber-400/50 p-5 rounded-2xl space-y-3 shadow-inner">
              <div className="text-4xl">⚔️🌸💎</div>
              <h3 className="text-base sm:text-lg font-black text-amber-300">《神撃のサバイバー：異世界転生記》</h3>
              <p className="text-xs text-slate-300">
                「今すぐ参戦してSSR超絶神剣を受け取れ！99%の勇者が絶叫！」
              </p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-amber-400 h-full transition-all duration-1000"
                  style={{ width: `${((3 - adContext.countdown) / 3) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-amber-200 font-bold">{adContext.title}</p>

            <button
              onClick={claimAdReward}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 font-black text-white text-sm rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer border border-emerald-300"
            >
              <Sparkles className="w-4 h-4 fill-current text-amber-300" />
              <span>
                {adContext.countdown > 0 ? `報酬を受け取る (${adContext.countdown}s スキップ)` : '報酬を受け取る (CLAIM)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Game Over Modal (with Ad Screen-Wipe Revive) */}
      {gameState === 'gameover' && runStats && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-950 border-2 border-rose-500 flex items-center justify-center text-3xl shadow-lg">
              💀
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-rose-400">無念… 討伐失敗</h2>
              <p className="text-xs text-slate-400">
                あと少しで{currentStage.survivalTime}秒制霸！全畫面消滅爆炎で即座に蘇生せよ！
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-left">
              <div>
                <span className="text-[10px] text-amber-200 block font-bold">生存時間</span>
                <span className="text-base font-mono font-black text-amber-400 tabular-nums">
                  {runStats.survivedTime.toFixed(1)}s / {currentStage.survivalTime}s
                </span>
              </div>
              <div>
                <span className="text-[10px] text-purple-200 block font-bold">魔物討伐数</span>
                <span className="text-base font-mono font-black text-purple-400 tabular-nums">
                  {runStats.kills} 隻
                </span>
              </div>
              <div>
                <span className="text-[10px] text-sky-200 block font-bold">到達Lv</span>
                <span className="text-base font-mono font-black text-sky-400 tabular-nums">
                  LV.{runStats.level}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-rose-200 block font-bold">総ダメージ</span>
                <span className="text-base font-mono font-black text-rose-400 tabular-nums">
                  {runStats.damageDealt}
                </span>
              </div>
            </div>

            <button
              onClick={() => triggerSimulatedAd('revive')}
              className="w-full py-4 px-4 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition cursor-pointer border-2 border-yellow-200 transform hover:scale-[1.02]"
            >
              <Tv className="w-5 h-5 text-slate-950 fill-current" />
              <span>[広告] 全画面消滅復活！神聖爆炎結界 + 3秒無敵</span>
            </button>

            <button
              onClick={() => startGame()}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>本關重試 (RETRY)</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Victory Modal (with NEXT STAGE Progression CTA!) */}
      {gameState === 'victory' && runStats && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/40">
              🏆
            </div>

            <div className="space-y-1">
              <div className="text-xs font-black text-amber-300 tracking-widest uppercase">
                ★★★ S-RANK STAGE CLEAR ★★★
              </div>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                關卡完全制霸 · 突破達成！
              </h2>
              <p className="text-xs text-amber-200/90 font-medium">
                {currentStage.title} ({currentStage.survivalTime}秒試煉) 順利通關！
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full bg-slate-950/80 p-3 rounded-2xl border border-amber-500/30 text-left">
              <div>
                <span className="text-[10px] text-amber-200 block font-bold">生存時間</span>
                <span className="text-base font-mono font-black text-amber-400 tabular-nums">
                  {currentStage.survivalTime}.0s (制霸)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-purple-200 block font-bold">魔物討伐数</span>
                <span className="text-base font-mono font-black text-purple-400 tabular-nums">
                  {runStats.kills} 隻
                </span>
              </div>
              <div>
                <span className="text-[10px] text-sky-200 block font-bold">到達Lv</span>
                <span className="text-base font-mono font-black text-sky-400 tabular-nums">
                  LV.{runStats.level}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block font-bold">復活回数</span>
                <span className="text-base font-mono font-black text-emerald-400 tabular-nums">
                  {runStats.revivedCount} 回
                </span>
              </div>
            </div>

            {/* If there is a next stage, show NEXT STAGE CTA! */}
            {nextStage ? (
              <button
                data-start="true"
                onClick={() => startGame(nextStage.id)}
                className="w-full py-4 px-6 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/30 border-2 border-yellow-200 flex items-center justify-center gap-2 cursor-pointer transition transform hover:scale-[1.02]"
              >
                <Trophy className="w-5 h-5 fill-current text-slate-950" />
                <span>進擊下一關：{nextStage.title.split('：')[0]} (NEXT STAGE)</span>
                <ChevronRight className="w-5 h-5 text-slate-950" />
              </button>
            ) : (
              <div className="p-3 bg-amber-400/20 border border-amber-400 rounded-xl text-amber-300 text-xs font-bold">
                🎉 恭喜！您已通關全戰役所有關卡！可前往設計工坊新增更多自訂關卡與魔王！
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={() => startGame(currentStage.id)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                重玩本關
              </button>
              <button
                onClick={() => setGameState('title')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 transition cursor-pointer"
              >
                返回選關主頁
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Paused Modal */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85">
          <div className="max-w-xs w-full bg-slate-900 border-2 border-amber-400/60 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <h2 className="text-xl font-black text-amber-300">戦況一時停止</h2>
            <div className="space-y-2 w-full">
              <button
                onClick={handlePauseToggle}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 font-black text-white rounded-xl transition cursor-pointer"
              >
                戦闘再開 (RESUME)
              </button>
              <button
                onClick={() => {
                  setIsPasskeyOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-indigo-900 hover:bg-indigo-800 border border-indigo-500 text-amber-300 font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-4 h-4" />
                <span>開啟設計模式 (Studio)</span>
              </button>
              <button
                onClick={() => setGameState('title')}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
              >
                返回標題選單
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Passkey Verification Modal */}
      <PasskeyModal
        isOpen={isPasskeyOpen}
        onClose={() => setIsPasskeyOpen(false)}
        onSuccess={() => {
          setIsPasskeyOpen(false);
          setIsDesignStudioOpen(true);
        }}
        correctPasskey={currentConfig.passkey || '8888'}
      />

      {/* 10. Interactive Design Studio Modal */}
      <DesignStudioModal
        isOpen={isDesignStudioOpen}
        onClose={() => setIsDesignStudioOpen(false)}
        config={currentConfig}
        onSaveAndApply={handleApplyConfig}
        onTestPlay={handleTestPlayConfig}
      />

      {/* 11. Japanese Class Promotion / Awakening Cut-in Modal */}
      {promotedHeroInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-none animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 text-center shadow-2xl shadow-amber-400/40 space-y-4">
            {/* Shinto Divine Crest & Particle Glow */}
            <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-400/20 border-2 border-amber-400 shadow-xl shadow-amber-400/40 flex items-center justify-center text-4xl animate-bounce">
              {promotedHeroInfo.promotedEmoji || '👑'}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>神威覺醒 · 轉職進化達成</span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1.5 drop-shadow">
                {promotedHeroInfo.promotedName}
              </h3>
              <p className="text-xs font-bold text-amber-300 mt-0.5">
                【{promotedHeroInfo.promotedTitle}】
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              {promotedHeroInfo.description || '神話級力量已徹底解放！獲得星宿神聖靈環，攻擊力、移動速度與生命上限全面突破！'}
            </p>

            {/* Stat Bonuse Badges */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold">
              <div className="bg-rose-950/80 border border-rose-500/50 p-2 rounded-xl text-rose-300 shadow">
                <div className="text-[9px] text-rose-400">攻擊力</div>
                +{promotedHeroInfo.bonusDamage}
              </div>
              <div className="bg-cyan-950/80 border border-cyan-500/50 p-2 rounded-xl text-cyan-300 shadow">
                <div className="text-[9px] text-cyan-400">移動速度</div>
                +{promotedHeroInfo.bonusSpeed}
              </div>
              <div className="bg-emerald-950/80 border border-emerald-500/50 p-2 rounded-xl text-emerald-300 shadow">
                <div className="text-[9px] text-emerald-400">生命上限</div>
                +{promotedHeroInfo.bonusHp}
              </div>
            </div>

            <button
              onClick={() => setPromotedHeroInfo(null)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm tracking-wider shadow-lg shadow-amber-400/30 transition cursor-pointer active:scale-95"
            >
              領取神威 · 繼續激戰！
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
