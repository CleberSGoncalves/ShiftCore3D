/**
 * @fileoverview Main Game Engine & Loop Coordinator for ShiftCore3D
 */

import { LEVELS } from './levels.js';
import { PlayerPhysics, CameraShaker, ParticleSystem } from './physics.js';
import { Renderer3D } from './engine3d.js';
import { sound } from './audio.js';
import { crazyGames } from './crazygames.js';
import { storage } from './storage.js';

export class GameEngine {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.hud = hud;
    this.renderer = new Renderer3D(canvas);
    this.shaker = new CameraShaker();
    this.particles = new ParticleSystem();

    this.currentLevelIndex = 0;
    this.level = null;
    this.player = null;

    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;

    this.keys = {};
    this.touchInput = { left: false, right: false };

    this.isRunning = false;
    this.isPaused = false;
    this.isHitStopped = false;
    this.lastTime = 0;
    this.animId = null;

    this.setupControls();
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }

      if (this.player && this.isRunning && !this.isPaused) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
          this.triggerJump();
        }
        if (e.code === 'KeyQ') {
          this.triggerRotateCCW();
        }
        if (e.code === 'KeyE') {
          this.triggerRotateCW();
        }
        if (e.code === 'KeyR' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          this.triggerFlip180();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Connect HUD callbacks
    this.hud.callbacks.onTouchInput = (dir, active) => {
      if (dir === 'left') this.touchInput.left = active;
      if (dir === 'right') this.touchInput.right = active;
    };

    this.hud.callbacks.onTouchAction = (action) => {
      if (!this.player || !this.isRunning || this.isPaused) return;
      if (action === 'jump') this.triggerJump();
      if (action === 'rotateCCW') this.triggerRotateCCW();
      if (action === 'rotateCW') this.triggerRotateCW();
      if (action === 'flip180') this.triggerFlip180();
    };

    this.hud.callbacks.onTogglePause = () => this.togglePause();

    this.hud.callbacks.onTuneParam = (param, value) => {
      if (!this.player) return;
      if (param === 'player_speed') this.player.speedMultiplier = parseFloat(value);
      if (param === 'jump_power') this.player.jumpMultiplier = parseFloat(value);
      if (param === 'gravity') this.player.gravityMultiplier = parseFloat(value);
    };
  }

  triggerJump() {
    if (this.player) {
      sound.playJump();
      this.player.triggerJump();
      // Jump dust particles
      const px = (this.player.x + this.player.w * 0.5) * this.renderer.tileSize;
      const py = (this.player.y + this.player.h) * this.renderer.tileSize;
      this.particles.emit(px, py, 6, '#00f5ff', 50, 0.35);
    }
  }

  triggerRotateCCW() {
    if (this.player && this.player.rotateCCW()) {
      sound.playGravityShift();
      this.shaker.addTrauma(0.3);
      this.emitGravityParticles();
      this.hud.updateStats({ gravityDir: this.player.gravityDir });
    }
  }

  triggerRotateCW() {
    if (this.player && this.player.rotateCW()) {
      sound.playGravityShift();
      this.shaker.addTrauma(0.3);
      this.emitGravityParticles();
      this.hud.updateStats({ gravityDir: this.player.gravityDir });
    }
  }

  triggerFlip180() {
    if (this.player && this.player.flip180()) {
      sound.playGravityShift();
      this.shaker.addTrauma(0.4);
      this.emitGravityParticles();
      this.hud.updateStats({ gravityDir: this.player.gravityDir });
    }
  }

  emitGravityParticles() {
    if (!this.player) return;
    const px = (this.player.x + this.player.w * 0.5) * this.renderer.tileSize;
    const py = (this.player.y + this.player.h * 0.5) * this.renderer.tileSize;
    this.particles.emit(px, py, 18, '#38bdf8', 140, 0.55);
  }

  start() {
    this.loadLevel(0);
    this.isRunning = true;
    this.isPaused = false;
    sound.startMusic();
    crazyGames.gameplayStart();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  loadLevel(index) {
    this.currentLevelIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    // Clone level data so collection states reset cleanly
    const raw = LEVELS[this.currentLevelIndex];
    this.level = JSON.parse(JSON.stringify(raw));

    this.player = new PlayerPhysics(this.level.playerStart.x, this.level.playerStart.y);
    this.health = this.maxHealth;

    this.hud.updateStats({
      sector: this.level.id,
      coresCollected: 0,
      coresTotal: this.level.cores.length,
      health: this.health,
      maxHealth: this.maxHealth,
      score: this.score,
      gravityDir: this.player.gravityDir
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.hud.showPauseModal(
        () => this.togglePause(),
        () => {
          this.hud.hideModal();
          this.isPaused = false;
          this.loadLevel(this.currentLevelIndex);
        }
      );
    } else {
      this.hud.hideModal();
    }
  }

  loop(timestamp) {
    if (!this.isRunning) return;

    let dt = (timestamp - this.lastTime) / 1000.0;
    this.lastTime = timestamp;
    dt = Math.max(0.001, Math.min(0.05, dt)); // Clamp delta time

    if (!this.isPaused && !this.isHitStopped) {
      this.update(dt);
    }

    this.renderer.render(this.level, this.player, this.particles, this.shaker, dt);
    this.animId = requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    // 1. Resolve Input
    let inputDir = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.touchInput.left) inputDir -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.touchInput.right) inputDir += 1;

    // 2. Physics & Player Update
    this.player.update(dt, inputDir, this.level.blocks);
    this.shaker.update(dt);
    this.particles.update(dt);

    // 3. Energy Cores Collection
    for (const core of this.level.cores) {
      if (!core.collected) {
        const dx = (this.player.x + this.player.w * 0.5) - (core.x + 0.5);
        const dy = (this.player.y + this.player.h * 0.5) - (core.y + 0.5);
        const dist = Math.hypot(dx, dy);

        if (dist < 0.85) {
          core.collected = true;
          this.score += 250;
          sound.playCorePickup();
          this.shaker.addTrauma(0.25);

          // Hit-Stop of 45ms for tactile juice
          this.triggerHitStop(45);

          // Particles
          const cx = (core.x + 0.5) * this.renderer.tileSize;
          const cy = (core.y + 0.5) * this.renderer.tileSize;
          this.particles.emit(cx, cy, 20, '#00f5ff', 120, 0.6);

          const collectedCount = this.level.cores.filter(c => c.collected).length;
          this.hud.updateStats({
            coresCollected: collectedCount,
            coresTotal: this.level.cores.length,
            score: this.score
          });
        }
      }
    }

    // 4. Laser Hazards Collision
    for (const laser of this.level.lasers) {
      const cycle = (this.renderer.time + laser.offset) % laser.period;
      const isActive = cycle < laser.period * 0.65;
      if (isActive && this.player.invulnerableTimer <= 0) {
        const px = this.player.x;
        const pw = this.player.w;
        const py = this.player.y;
        const ph = this.player.h;

        const lx = laser.x + 0.35;
        const lw = 0.3;
        const ly1 = laser.y1;
        const ly2 = laser.y2 + 1;

        if (px + pw > lx && px < lx + lw && py + ph > ly1 && py < ly2) {
          this.takeDamage(35);
        }
      }
    }

    // 5. Plasma Blocks Collision
    for (const b of this.level.blocks) {
      if (b.type === 'plasma' && this.player.invulnerableTimer <= 0) {
        if (this.player.checkOverlap(this.player.x, this.player.y, b)) {
          this.takeDamage(40);
        }
      }
    }

    // 6. Warp Portal Check
    const allCoresCollected = this.level.cores.every(c => c.collected);
    if (allCoresCollected) {
      const portal = this.level.portal;
      const pdx = (this.player.x + this.player.w * 0.5) - (portal.x + 0.5);
      const pdy = (this.player.y + this.player.h * 0.5) - (portal.y + 0.5);
      if (Math.hypot(pdx, pdy) < 0.9) {
        this.completeLevel();
      }
    }
  }

  takeDamage(amount) {
    if (this.player.hasQuantumShield) {
      this.player.hasQuantumShield = false;
      this.player.invulnerableTimer = 1.6;
      this.shaker.addTrauma(0.5);
      sound.playDamage();
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.player.invulnerableTimer = 1.2;
    this.shaker.addTrauma(0.65);
    this.triggerHitStop(70);
    sound.playDamage();

    this.hud.updateStats({ health: this.health, maxHealth: this.maxHealth });

    if (this.health <= 0) {
      this.triggerGameOver();
    }
  }

  triggerHitStop(durationMs) {
    this.isHitStopped = true;
    setTimeout(() => {
      this.isHitStopped = false;
    }, durationMs);
  }

  completeLevel() {
    this.isRunning = false;
    sound.playPortalWarp();
    this.shaker.addTrauma(0.5);

    // Save progress
    storage.updateHighScore(this.score);
    storage.unlockSector(this.currentLevelIndex + 2);

    crazyGames.requestMidgameAd(() => {
      this.hud.showVictoryModal(
        this.level.id,
        this.score,
        () => {
          if (this.currentLevelIndex < LEVELS.length - 1) {
            this.loadLevel(this.currentLevelIndex + 1);
            this.isRunning = true;
            this.lastTime = performance.now();
            this.loop(this.lastTime);
          } else {
            // All levels finished! Loop back with score preserved
            this.loadLevel(0);
            this.isRunning = true;
            this.lastTime = performance.now();
            this.loop(this.lastTime);
          }
        },
        () => {
          this.score *= 2;
          this.hud.updateStats({ score: this.score });
        }
      );
    });
  }

  triggerGameOver() {
    this.isRunning = false;
    crazyGames.gameplayStop();

    this.hud.showGameOverModal(
      // Retry
      () => {
        this.loadLevel(this.currentLevelIndex);
        this.isRunning = true;
        crazyGames.gameplayStart();
        this.lastTime = performance.now();
        this.loop(this.lastTime);
      },
      // Revive with Quantum Shield
      () => {
        this.health = 100;
        this.player.hasQuantumShield = true;
        this.player.invulnerableTimer = 2.0;
        this.hud.updateStats({ health: this.health, maxHealth: this.maxHealth });
        this.isRunning = true;
        crazyGames.gameplayStart();
        this.lastTime = performance.now();
        this.loop(this.lastTime);
      }
    );
  }
}
