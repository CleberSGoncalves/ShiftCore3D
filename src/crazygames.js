/**
 * @fileoverview CrazyGames SDK v3 Integration Module for ShiftCore3D
 * Official SDK v3 lifecycle, gameplay tracking, Rewarded & Midgame Ads.
 */

import { storage } from './storage.js';

class CrazyGamesBridge {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
    this.hasAdblock = false;
    this.onMuteAudio = null;
    this.onUnmuteAudio = null;
    this.lastMidgameTime = Date.now();
  }

  async init(muteCallback, unmuteCallback) {
    this.onMuteAudio = muteCallback || null;
    this.onUnmuteAudio = unmuteCallback || null;

    if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
      try {
        this.sdk = window.CrazyGames.SDK;
        await this.sdk.init();
        this.isInitialized = true;
        console.log('[CrazyGames] SDK v3 initialized successfully ✓');
      } catch (err) {
        console.warn('[CrazyGames] SDK init warning (AdBlock/Local):', err);
        this.hasAdblock = true;
      }
    } else {
      console.log('[CrazyGames] Running in standalone / simulation mode.');
    }
  }

  gameplayStart() {
    if (this.isInitialized && this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStart === 'function') {
      try {
        this.sdk.game.gameplayStart();
      } catch (e) {
        console.warn('[CrazyGames] gameplayStart error:', e);
      }
    }
  }

  gameplayStop() {
    if (this.isInitialized && this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStop === 'function') {
      try {
        this.sdk.game.gameplayStop();
      } catch (e) {
        console.warn('[CrazyGames] gameplayStop error:', e);
      }
    }
  }

  async requestRewardedAd(onRewarded, onError) {
    if (this.onMuteAudio) this.onMuteAudio();

    if (this.isInitialized && this.sdk && this.sdk.ad && typeof this.sdk.ad.requestAd === 'function') {
      try {
        await this.sdk.ad.requestAd('rewarded', {
          adStarted: () => {
            console.log('[CrazyGames] Rewarded ad started');
            if (this.onMuteAudio) this.onMuteAudio();
          },
          adFinished: () => {
            console.log('[CrazyGames] Rewarded ad finished ✓');
            if (this.onUnmuteAudio) this.onUnmuteAudio();
            if (onRewarded) onRewarded();
          },
          adError: (error) => {
            console.warn('[CrazyGames] Rewarded ad error:', error);
            if (this.onUnmuteAudio) this.onUnmuteAudio();
            // Fallback gracefully so player is not punished in dev/sandbox
            if (onRewarded) onRewarded();
          }
        });
      } catch (err) {
        console.warn('[CrazyGames] Rewarded request catch:', err);
        if (this.onUnmuteAudio) this.onUnmuteAudio();
        if (onRewarded) onRewarded();
      }
    } else {
      // Sandbox / Test fallback with simulated 1.5s delay
      console.log('[CrazyGames] Simulating rewarded ad...');
      setTimeout(() => {
        if (this.onUnmuteAudio) this.onUnmuteAudio();
        if (onRewarded) onRewarded();
      }, 1200);
    }
  }

  async requestMidgameAd(onCompleted) {
    // Throttle midgame ads to at least 3 minutes (180s)
    const now = Date.now();
    if (now - this.lastMidgameTime < 180000) {
      if (onCompleted) onCompleted();
      return;
    }
    this.lastMidgameTime = now;

    if (this.onMuteAudio) this.onMuteAudio();

    if (this.isInitialized && this.sdk && this.sdk.ad && typeof this.sdk.ad.requestAd === 'function') {
      try {
        await this.sdk.ad.requestAd('midgame', {
          adStarted: () => {
            if (this.onMuteAudio) this.onMuteAudio();
          },
          adFinished: () => {
            if (this.onUnmuteAudio) this.onUnmuteAudio();
            if (onCompleted) onCompleted();
          },
          adError: () => {
            if (this.onUnmuteAudio) this.onUnmuteAudio();
            if (onCompleted) onCompleted();
          }
        });
      } catch (e) {
        if (this.onUnmuteAudio) this.onUnmuteAudio();
        if (onCompleted) onCompleted();
      }
    } else {
      if (this.onUnmuteAudio) this.onUnmuteAudio();
      if (onCompleted) onCompleted();
    }
  }
}

export const crazyGames = new CrazyGamesBridge();
export default crazyGames;
