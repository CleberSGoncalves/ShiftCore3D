/**
 * @fileoverview Main Application Entry Point for ShiftCore3D
 * Bootstraps CrazyGames SDK v3, Splash Intro, HUD, and 3D Game Engine.
 */

import { crazyGames } from './crazygames.js';
import { CinematicIntro } from './splash.js';
import { GameHUD } from './hud.js';
import { GameEngine } from './game.js';
import { sound } from './audio.js';
import './style.css';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize CrazyGames SDK v3 with audio mute hooks
    await crazyGames.init(
      () => sound.muteTemporarily(),
      () => sound.unmuteTemporarily()
    );

    // 2. Resolve Core Containers
    const stageEl = document.getElementById('game-stage');
    const canvas = document.getElementById('game-canvas');

    if (!stageEl || !canvas) {
      console.error('[ShiftCore] Critical DOM elements #game-stage or #game-canvas missing!');
      return;
    }

    let engine = null;
    let hud = null;

    // 3. Launch Cinematic Intro (FluidCleb 0s-2.8s + Lore)
    const intro = new CinematicIntro(stageEl, () => {
      // Build HUD
      hud = new GameHUD(stageEl);

      // Start Game Engine
      engine = new GameEngine(canvas, hud);
      engine.start();
    });

    intro.start();

    // 4. Window Visibility & Focus Handlers (Sound & Physics stability)
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        sound.muteTemporarily();
      } else {
        sound.unmuteTemporarily();
      }
    });

    window.addEventListener('blur', () => {
      sound.muteTemporarily();
    });

    window.addEventListener('focus', () => {
      sound.unmuteTemporarily();
    });

  } catch (err) {
    console.error('[ShiftCore] Application bootstrap error:', err);
  }
});
