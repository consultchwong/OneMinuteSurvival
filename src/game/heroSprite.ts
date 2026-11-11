/**
 * Directional Animated Sprite Renderer for Hero Characters & Classes
 * Supports 4-direction (Down, Up, Left, Right) animated walking cycles with distinct
 * headwear, outfits, weapons, and colors dynamically derived from SpriteAssetConfig!
 */

import { SpriteAssetConfig, getSpriteById, DEFAULT_SPRITE_LIBRARY } from './spriteLibrary';

export type Direction = 'down' | 'up' | 'left' | 'right';
export type HeroCategory = 'mage' | 'ronin' | 'ranger' | 'paladin' | 'custom';

export class HeroSpriteRenderer {
  private customImg: HTMLImageElement | null = null;
  private customImgLoaded: boolean = false;
  private lastCustomUrl: string = '';

  public setCustomImage(url?: string) {
    if (!url) {
      this.customImg = null;
      this.customImgLoaded = false;
      this.lastCustomUrl = '';
      return;
    }
    if (url === this.lastCustomUrl && this.customImgLoaded) return;

    this.lastCustomUrl = url;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.customImg = img;
      this.customImgLoaded = true;
    };
    img.onerror = () => {
      this.customImg = null;
      this.customImgLoaded = false;
    };
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: Direction,
    walkCycle: number,
    isMoving: boolean,
    size: number = 44,
    spriteOrConfig?: SpriteAssetConfig | string,
    allSprites?: SpriteAssetConfig[],
    isPromoted: boolean = false,
    auraColor: string = '#facc15'
  ) {
    // Resolve sprite config
    let sprite: SpriteAssetConfig;
    if (typeof spriteOrConfig === 'object' && spriteOrConfig !== null && spriteOrConfig.id) {
      sprite = spriteOrConfig;
    } else if (typeof spriteOrConfig === 'string') {
      sprite = getSpriteById(allSprites || DEFAULT_SPRITE_LIBRARY, spriteOrConfig);
    } else {
      sprite = DEFAULT_SPRITE_LIBRARY[0];
    }

    // Handle custom image URL if defined in the sprite
    if (sprite.customImageUrl) {
      if (sprite.customImageUrl !== this.lastCustomUrl) {
        this.setCustomImage(sprite.customImageUrl);
      }
    } else if (this.customImgLoaded) {
      this.setCustomImage('');
    }

    ctx.save();
    ctx.translate(x, y);

    // Divine Promoted Aura (轉職覺醒神光)
    if (isPromoted) {
      ctx.save();
      const auraPulse = Math.sin(walkCycle * 0.8) * 4;
      ctx.strokeStyle = auraColor;
      ctx.shadowColor = auraColor;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2.5;

      // Outer Revolving Hexagram
      ctx.beginPath();
      ctx.arc(0, 8, 30 + auraPulse, 0, Math.PI * 2);
      ctx.stroke();

      // Halo above head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, -28 + (isMoving ? Math.sin(walkCycle) * 2 : 0), 12, 3.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    // If a custom image was provided on the sprite and successfully loaded
    if (this.customImgLoaded && this.customImg) {
      const bobY = isMoving ? Math.sin(walkCycle) * 3 : 0;
      const flipX = dir === 'left' ? -1 : 1;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, size * 0.42, size * 0.4, size * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.scale(flipX, 1);
      ctx.beginPath();
      ctx.arc(0, bobY, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.customImg, -size / 2, -size / 2 + bobY, size, size);
      ctx.restore();

      ctx.strokeStyle = isPromoted ? auraColor : sprite.accentColor || '#facc15';
      ctx.lineWidth = isPromoted ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, bobY, size / 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // PROCEDURAL DIRECTIONAL SPRITE RENDERING
    const bob = isMoving ? Math.sin(walkCycle) * 2.5 : Math.sin(walkCycle * 0.5) * 1.0;
    const legSwing = isMoving ? Math.sin(walkCycle) * 7 : 0;
    const weaponSwing = isMoving ? Math.cos(walkCycle) * 0.22 : 0;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (dir === 'down') {
      this.drawFacingDown(ctx, bob, legSwing, weaponSwing, sprite);
    } else if (dir === 'up') {
      this.drawFacingUp(ctx, bob, legSwing, weaponSwing, sprite);
    } else if (dir === 'left') {
      ctx.save();
      ctx.scale(-1, 1);
      this.drawFacingSide(ctx, bob, legSwing, weaponSwing, sprite);
      ctx.restore();
    } else if (dir === 'right') {
      this.drawFacingSide(ctx, bob, legSwing, weaponSwing, sprite);
    }

    ctx.restore();
  }

  // --- FACING DOWN ---
  private drawFacingDown(
    ctx: CanvasRenderingContext2D,
    bob: number,
    legSwing: number,
    weaponSwing: number,
    sprite: SpriteAssetConfig
  ) {
    const pColor = sprite.primaryColor;
    const sColor = sprite.secondaryColor;
    const aColor = sprite.accentColor;

    // Boots
    ctx.fillStyle = sColor;
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(-8, 12 + legSwing, 6, 8, 3);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(2, 12 - legSwing, 6, 8, 3);
    ctx.fill();
    ctx.stroke();

    // Cloak / Robe back
    ctx.fillStyle = sColor;
    ctx.beginPath();
    ctx.moveTo(-14, 2 + bob);
    ctx.lineTo(-18, 16 + bob);
    ctx.lineTo(18, 16 + bob);
    ctx.lineTo(14, 2 + bob);
    ctx.closePath();
    ctx.fill();

    // Body Outfit
    ctx.fillStyle = pColor;
    ctx.beginPath();
    ctx.moveTo(-11, 0 + bob);
    ctx.lineTo(-14, 14 + bob);
    ctx.lineTo(14, 14 + bob);
    ctx.lineTo(11, 0 + bob);
    ctx.closePath();
    ctx.fill();

    // Belt / Chestplate Trim
    ctx.fillStyle = aColor;
    ctx.fillRect(-10, 6 + bob, 20, 2.5);

    // Head
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(0, -6 + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    // Anime Eyes
    ctx.fillStyle = aColor;
    ctx.beginPath();
    ctx.ellipse(-3.5, -6 + bob, 2, 2.8, 0, 0, Math.PI * 2);
    ctx.ellipse(3.5, -6 + bob, 2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Catchlight in eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -7 + bob, 0.8, 0, Math.PI * 2);
    ctx.arc(3, -7 + bob, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = sColor;
    ctx.beginPath();
    ctx.moveTo(-9, -8 + bob);
    ctx.quadraticCurveTo(0, -13 + bob, 9, -8 + bob);
    ctx.lineTo(8, -4 + bob);
    ctx.lineTo(4, -5 + bob);
    ctx.lineTo(0, -3 + bob);
    ctx.lineTo(-4, -5 + bob);
    ctx.lineTo(-8, -4 + bob);
    ctx.closePath();
    ctx.fill();

    // Shape-specific headwear & weapon
    this.drawHeadgear(ctx, bob, 0, false, sprite);
    this.drawWeapon(ctx, 14, 2 + bob, weaponSwing, sprite);
  }

  // --- FACING UP ---
  private drawFacingUp(
    ctx: CanvasRenderingContext2D,
    bob: number,
    legSwing: number,
    weaponSwing: number,
    sprite: SpriteAssetConfig
  ) {
    const pColor = sprite.primaryColor;
    const sColor = sprite.secondaryColor;
    const aColor = sprite.accentColor;

    // Boots
    ctx.fillStyle = sColor;
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(-8, 12 - legSwing, 6, 8, 3);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(2, 12 + legSwing, 6, 8, 3);
    ctx.fill();
    ctx.stroke();

    // Flowing Cape (Back view)
    ctx.fillStyle = sColor;
    ctx.beginPath();
    ctx.moveTo(-13, 0 + bob);
    ctx.lineTo(-17, 16 + bob);
    ctx.lineTo(17, 16 + bob);
    ctx.lineTo(13, 0 + bob);
    ctx.closePath();
    ctx.fill();

    // Cape crest / emblem
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 8 + bob, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Back of Hair
    ctx.fillStyle = sColor;
    ctx.beginPath();
    ctx.arc(0, -6 + bob, 9.5, 0, Math.PI * 2);
    ctx.fill();

    this.drawHeadgear(ctx, bob, 0, true, sprite);
    this.drawWeapon(ctx, 15, -2 + bob, weaponSwing, sprite);
  }

  // --- FACING SIDE ---
  private drawFacingSide(
    ctx: CanvasRenderingContext2D,
    bob: number,
    legSwing: number,
    weaponSwing: number,
    sprite: SpriteAssetConfig
  ) {
    const pColor = sprite.primaryColor;
    const sColor = sprite.secondaryColor;
    const aColor = sprite.accentColor;

    // Boots
    ctx.fillStyle = sColor;
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(-6 - legSwing, 12, 6, 8, 3);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(2 + legSwing, 12, 6, 8, 3);
    ctx.fill();
    ctx.stroke();

    // Cloak
    ctx.fillStyle = sColor;
    ctx.beginPath();
    ctx.moveTo(-5, 0 + bob);
    ctx.lineTo(-18, 15 + bob);
    ctx.lineTo(6, 14 + bob);
    ctx.lineTo(5, 0 + bob);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = pColor;
    ctx.beginPath();
    ctx.roundRect(-6, 0 + bob, 14, 14, 4);
    ctx.fill();

    ctx.fillStyle = aColor;
    ctx.fillRect(-6, 6 + bob, 14, 2.5);

    // Head
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(2, -6 + bob, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = aColor;
    ctx.beginPath();
    ctx.ellipse(6, -6 + bob, 1.8, 2.6, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = sColor;
    ctx.beginPath();
    ctx.moveTo(-6, -7 + bob);
    ctx.quadraticCurveTo(2, -12 + bob, 9, -5 + bob);
    ctx.lineTo(7, -1 + bob);
    ctx.lineTo(4, -3 + bob);
    ctx.lineTo(1, 0 + bob);
    ctx.lineTo(-4, -3 + bob);
    ctx.closePath();
    ctx.fill();

    this.drawHeadgear(ctx, bob, 0.12, false, sprite);
    this.drawWeapon(ctx, 15, 2 + bob, weaponSwing, sprite);
  }

  private drawHeadgear(
    ctx: CanvasRenderingContext2D,
    bob: number,
    tilt: number,
    isBack: boolean,
    sprite: SpriteAssetConfig
  ) {
    ctx.save();
    ctx.translate(0, -9 + bob);
    ctx.rotate(tilt);

    const shape = sprite.shape;
    const pColor = sprite.primaryColor;
    const sColor = sprite.secondaryColor;
    const aColor = sprite.accentColor;

    if (shape === 'mage_robe') {
      // Wizard Hat
      ctx.fillStyle = sColor;
      ctx.strokeStyle = aColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(-4, -14, 6, -22);
      ctx.quadraticCurveTo(8, -12, 10, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.ellipse(0, -1, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 'samurai') {
      // Samurai Straw/Obsidian Kasa or Headband
      ctx.fillStyle = sColor;
      ctx.beginPath();
      ctx.ellipse(0, -2, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = aColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (!isBack) {
        ctx.fillStyle = aColor;
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (shape === 'archer') {
      // Elven Woodland Cap with Feather
      ctx.fillStyle = sColor;
      ctx.beginPath();
      ctx.moveTo(-10, 2);
      ctx.lineTo(10, 2);
      ctx.lineTo(4, -10);
      ctx.lineTo(-6, -10);
      ctx.closePath();
      ctx.fill();

      // Feather
      ctx.strokeStyle = aColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(3, -5);
      ctx.lineTo(11, -15);
      ctx.stroke();
    } else if (shape === 'knight') {
      // Golden / Silver Holy Visor Helmet
      ctx.fillStyle = pColor;
      ctx.strokeStyle = aColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -2, 9, Math.PI, 0);
      ctx.lineTo(8, 2);
      ctx.lineTo(-8, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing Crest
      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(5, -6);
      ctx.lineTo(-5, -6);
      ctx.closePath();
      ctx.fill();
    } else if (shape === 'dragon_knight') {
      // Dragon Horns
      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.moveTo(-7, -2);
      ctx.lineTo(-14, -16);
      ctx.lineTo(-3, -7);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(7, -2);
      ctx.lineTo(14, -16);
      ctx.lineTo(3, -7);
      ctx.closePath();
      ctx.fill();
    } else if (shape === 'ninja') {
      // Ninja Headband & Shinobi Plate
      ctx.fillStyle = sColor;
      ctx.fillRect(-10, 0, 20, 4);
      ctx.fillStyle = aColor;
      ctx.fillRect(-4, 0, 8, 4);
    } else if (shape === 'valkyrie') {
      // Golden Crown with Light Wings
      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.moveTo(-8, 1);
      ctx.lineTo(-10, -10);
      ctx.lineTo(-4, -4);
      ctx.lineTo(0, -12);
      ctx.lineTo(4, -4);
      ctx.lineTo(10, -10);
      ctx.lineTo(8, 1);
      ctx.closePath();
      ctx.fill();
    } else {
      // Universal anime circlet
      ctx.strokeStyle = aColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9, Math.PI * 0.9, Math.PI * 0.1, true);
      ctx.stroke();

      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawWeapon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    swing: number,
    sprite: SpriteAssetConfig
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(swing);

    if (sprite.weaponEmoji) {
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sprite.weaponEmoji, 0, 0);
      ctx.restore();
      return;
    }

    const aColor = sprite.accentColor;
    const pColor = sprite.primaryColor;

    if (sprite.shape === 'mage_robe') {
      // Crystal Staff
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1.5, -12, 3, 24);
      ctx.fillStyle = aColor;
      ctx.beginPath();
      ctx.arc(0, -13, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pColor;
      ctx.shadowColor = aColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(4.5, -15);
      ctx.lineTo(0, -11);
      ctx.lineTo(-4.5, -15);
      ctx.closePath();
      ctx.fill();
    } else if (sprite.shape === 'samurai') {
      // Katana Blade
      ctx.fillStyle = '#475569';
      ctx.fillRect(-1.5, 4, 3, 8);
      ctx.fillStyle = aColor;
      ctx.fillRect(-3, 3, 6, 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.shadowColor = aColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-1, 3);
      ctx.lineTo(-1, -18);
      ctx.lineTo(1, -21);
      ctx.lineTo(1, 3);
      ctx.closePath();
      ctx.fill();
    } else if (sprite.shape === 'archer') {
      // Recurve Bow
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(3, -11);
      ctx.lineTo(3, 11);
      ctx.stroke();
    } else {
      // Holy Shield or Staff
      ctx.fillStyle = aColor;
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(9, -8);
      ctx.lineTo(6, 12);
      ctx.lineTo(0, 16);
      ctx.lineTo(-6, 12);
      ctx.lineTo(-9, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

export const heroSprite = new HeroSpriteRenderer();
