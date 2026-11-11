import React, { useRef, useEffect, useState } from 'react';
import {
  SpriteAssetConfig,
  renderSpriteInCanvas,
} from '../game/spriteLibrary';

interface SpriteCanvasPreviewProps {
  sprite: SpriteAssetConfig;
  width?: number;
  height?: number;
  size?: number;
  dir?: 'down' | 'up' | 'left' | 'right';
  autoWalk?: boolean;
  isPromoted?: boolean;
  auraColor?: string;
  interactiveControls?: boolean;
  className?: string;
}

export function SpriteCanvasPreview({
  sprite,
  width = 96,
  height = 96,
  size = 46,
  dir: propDir,
  autoWalk = true,
  isPromoted = false,
  auraColor = '#facc15',
  interactiveControls = false,
  className = '',
}: SpriteCanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentDir, setCurrentDir] = useState<'down' | 'up' | 'left' | 'right'>(propDir || 'down');
  const [showAura, setShowAura] = useState<boolean>(isPromoted);

  useEffect(() => {
    if (propDir) {
      setCurrentDir(propDir);
    }
  }, [propDir]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let walkCycle = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      if (autoWalk) {
        walkCycle += dt * 6.5;
      }

      ctx.clearRect(0, 0, width, height);

      // Background Mat / Magic Hexagram Circle
      ctx.save();
      const grad = ctx.createRadialGradient(width / 2, height / 2, 8, width / 2, height / 2, width / 2);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.7, '#020617');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Decorative Shrine / Magic Circle
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 + 8, size * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.strokeRect(width / 2 - size * 0.35, height / 2 + 8 - size * 0.35, size * 0.7, size * 0.7);
      ctx.restore();

      // Render the animated sprite!
      renderSpriteInCanvas(
        ctx,
        sprite,
        width / 2,
        height / 2 - 2,
        size,
        currentDir,
        walkCycle,
        true,
        showAura,
        auraColor
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [sprite, width, height, size, currentDir, autoWalk, showAura, auraColor]);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative rounded-xl overflow-hidden border border-amber-400/40 shadow-inner bg-slate-950">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block"
        />
        {sprite.weaponEmoji && (
          <span className="absolute top-1 right-1 text-xs bg-slate-900/80 rounded px-1 border border-slate-700/60 pointer-events-none">
            {sprite.weaponEmoji}
          </span>
        )}
      </div>

      {interactiveControls && (
        <div className="flex items-center gap-1 mt-1.5 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => setCurrentDir('down')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
              currentDir === 'down'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="面朝下 (Down)"
          >
            ⬇ 前
          </button>
          <button
            type="button"
            onClick={() => setCurrentDir('up')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
              currentDir === 'up'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="面朝上 (Up)"
          >
            ⬆ 後
          </button>
          <button
            type="button"
            onClick={() => setCurrentDir('left')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
              currentDir === 'left'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="面朝左 (Left)"
          >
            ⬅ 左
          </button>
          <button
            type="button"
            onClick={() => setCurrentDir('right')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
              currentDir === 'right'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="面朝右 (Right)"
          >
            ➡ 右
          </button>
          <button
            type="button"
            onClick={() => setShowAura(!showAura)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
              showAura
                ? 'bg-purple-500 text-white font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="切換神環 (Toggle Aura)"
          >
            ✨
          </button>
        </div>
      )}
    </div>
  );
}
