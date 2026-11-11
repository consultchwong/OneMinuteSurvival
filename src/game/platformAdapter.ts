/**
 * Platform & Monetization Adapter
 * Supports CrazyGames SDK, GamePix SDK, Y8, and Local Simulation.
 * Automatically detects hosting environment and invokes native platform ads.
 */

export type AdType = 'rewarded' | 'midgame';

export interface AdCallbacks {
  onStart?: () => void;
  onFinish?: (success: boolean) => void;
  onError?: (err?: any) => void;
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: {
        ad?: {
          requestAd: (
            type: 'rewarded' | 'midgame',
            callbacks: {
              adStarted?: () => void;
              adFinished?: () => void;
              adError?: (error: any) => void;
            }
          ) => void;
        };
        game?: {
          gameplayStart?: () => void;
          gameplayStop?: () => void;
          happytime?: () => void;
        };
      };
    };
    GamePix?: {
      rewardAd: () => Promise<{ success: boolean }>;
      interstitialAd: () => Promise<{ success: boolean }>;
      pause?: () => void;
      resume?: () => void;
    };
  }
}

export class PlatformMonetizationManager {
  private static instance: PlatformMonetizationManager;

  public static getInstance(): PlatformMonetizationManager {
    if (!PlatformMonetizationManager.instance) {
      PlatformMonetizationManager.instance = new PlatformMonetizationManager();
    }
    return PlatformMonetizationManager.instance;
  }

  /**
   * Detect currently active platform SDK
   */
  public detectPlatform(): 'crazygames' | 'gamepix' | 'standalone' {
    if (typeof window !== 'undefined') {
      if (window.CrazyGames?.SDK?.ad) return 'crazygames';
      if (window.GamePix?.rewardAd) return 'gamepix';
    }
    return 'standalone';
  }

  /**
   * Request a Rewarded Ad (for Revive, Reroll, or Select All perks)
   * If real platform SDK exists, calls native ad; otherwise falls back to callback.
   */
  public showRewardedAd(
    onReward: () => void,
    onFallbackModal?: () => void,
    onAudioMute?: (muted: boolean) => void
  ) {
    const platform = this.detectPlatform();

    if (platform === 'crazygames' && window.CrazyGames?.SDK?.ad) {
      onAudioMute?.(true);
      window.CrazyGames.SDK.game?.gameplayStop?.();
      window.CrazyGames.SDK.ad.requestAd('rewarded', {
        adStarted: () => {
          onAudioMute?.(true);
        },
        adFinished: () => {
          onAudioMute?.(false);
          window.CrazyGames?.SDK?.game?.gameplayStart?.();
          onReward();
        },
        adError: (err) => {
          console.warn('[CrazyGames] Rewarded ad error:', err);
          onAudioMute?.(false);
          window.CrazyGames?.SDK?.game?.gameplayStart?.();
          // Fallback reward on ad error to prevent blocking player
          onReward();
        },
      });
      return;
    }

    if (platform === 'gamepix' && window.GamePix?.rewardAd) {
      onAudioMute?.(true);
      window.GamePix.pause?.();
      window.GamePix.rewardAd().then((res) => {
        onAudioMute?.(false);
        window.GamePix?.resume?.();
        if (res && res.success) {
          onReward();
        } else {
          onReward();
        }
      }).catch((e) => {
        console.warn('[GamePix] Ad error:', e);
        onAudioMute?.(false);
        window.GamePix?.resume?.();
        onReward();
      });
      return;
    }

    // Default: Trigger interactive in-game simulation modal
    if (onFallbackModal) {
      onFallbackModal();
    } else {
      onReward();
    }
  }

  /**
   * Notify platform that gameplay session started
   */
  public reportGameplayStart() {
    if (window.CrazyGames?.SDK?.game?.gameplayStart) {
      window.CrazyGames.SDK.game.gameplayStart();
    }
  }

  /**
   * Notify platform that gameplay session stopped (pause or game over)
   */
  public reportGameplayStop() {
    if (window.CrazyGames?.SDK?.game?.gameplayStop) {
      window.CrazyGames.SDK.game.gameplayStop();
    }
  }

  /**
   * CrazyGames "HappyTime" - cheer effect when boss defeated or stage cleared!
   */
  public reportHappyTime() {
    if (window.CrazyGames?.SDK?.game?.happytime) {
      window.CrazyGames.SDK.game.happytime();
    }
  }
}

export const platformMonetization = PlatformMonetizationManager.getInstance();
