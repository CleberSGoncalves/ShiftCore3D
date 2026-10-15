/**
 * @fileoverview Cinematic Intro & FluidCleb Interactive Splash Screen for ShiftCore3D
 * Compliant with Brand Rules & CrazyGames "Land in Gameplay" requirements.
 */

import { sound } from './audio.js';
import { i18n } from './i18n.js';

export class CinematicIntro {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.startTime = null;
    this.finished = false;

    this.sound1Played = false;
    this.sound2Played = false;

    // Phases: 'splash' (0 to 2.8s) -> 'lore' -> gameplay
    this.phase = 'splash';
    this.loreStartTime = null;

    // Cosmic background particles
    this.particles = [];
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 2.5 + 0.8,
        color: ['#00f5ff', '#38bdf8', '#0284c7', '#94a3b8'][Math.floor(Math.random() * 4)],
        alpha: Math.random() * 0.7 + 0.2,
        speedY: (Math.random() - 0.5) * 0.03
      });
    }

    this.initDOM();
  }

  initDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'intro-cinematic-wrapper';
    this.wrapper.innerHTML = `
      <canvas class="intro-canvas" id="intro-canvas"></canvas>
      <div class="intro-lore-overlay hidden" id="intro-lore-box">
        <div class="lore-glass-card">
          <div class="lore-tag">🚀 ${i18n.t('game_title')}</div>
          <h2 class="lore-act-title" id="lore-title">${i18n.t('lore_act1_title')}</h2>
          <p class="lore-act-desc" id="lore-desc">${i18n.t('lore_act1_desc')}</p>
          <div class="lore-controls">
            <button class="lore-btn lore-btn-primary" id="btn-start-game">
              ${i18n.t('play_now')}
            </button>
            <button class="lore-btn lore-btn-skip" id="btn-skip-lore">
              ${i18n.t('skip_story')}
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.wrapper);
    this.canvas = this.wrapper.querySelector('#intro-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.loreBox = this.wrapper.querySelector('#intro-lore-box');

    this.wrapper.querySelector('#btn-start-game').onclick = () => this.finish();
    this.wrapper.querySelector('#btn-skip-lore').onclick = () => this.finish();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.wrapper.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  start() {
    this.startTime = performance.now();
    this.animId = requestAnimationFrame((ts) => this.loop(ts));
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    sound.playButtonClick();

    this.wrapper.classList.add('intro-fade-out');
    setTimeout(() => {
      this.wrapper.remove();
      if (this.onComplete) this.onComplete();
    }, 450);
  }

  loop(timestamp) {
    if (this.finished) return;
    const elapsed = timestamp - this.startTime;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // Deep space gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#00030a');
    bg.addColorStop(1, '#050c18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Cosmic floating particles
    for (const p of this.particles) {
      p.y += p.speedY * 0.016;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    if (this.phase === 'splash') {
      const t = Math.min(elapsed / 2800, 1.0);

      // Audio triggers
      if (t >= 0.05 && !this.sound1Played) {
        sound.playFluidClebIntro();
        this.sound1Played = true;
      }
      if (t >= 0.55 && !this.sound2Played) {
        sound.playFluidFusion();
        this.sound2Played = true;
      }

      this.drawFluidClebBrand(ctx, width, height, t);

      if (t >= 1.0) {
        this.phase = 'lore';
        this.loreStartTime = timestamp;
        this.loreBox.classList.remove('hidden');
        this.loreBox.classList.add('animate-fadeIn');
      }
    }

    if (!this.finished) {
      this.animId = requestAnimationFrame((ts) => this.loop(ts));
    }
  }

  drawFluidClebBrand(ctx, width, height, t) {
    const cx = width / 2;
    const cy = height / 2;

    // Phase 1 (0-0.45): Orbes azuis convergindo para o centro
    const orbMerge = Math.min(1.0, t / 0.5);
    const easeMerge = orbMerge < 0.5 ? 2 * orbMerge * orbMerge : 1 - Math.pow(-2 * orbMerge + 2, 2) / 2;
    const dist = (width * 0.28) * (1 - easeMerge);

    // Left orb
    const grad1 = ctx.createRadialGradient(cx - dist, cy, 2, cx - dist, cy, 70);
    grad1.addColorStop(0, '#00f5ff');
    grad1.addColorStop(0.4, '#38bdf888');
    grad1.addColorStop(1, '#0284c700');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(cx - dist, cy, 70, 0, Math.PI * 2);
    ctx.fill();

    // Right orb
    const grad2 = ctx.createRadialGradient(cx + dist, cy, 2, cx + dist, cy, 70);
    grad2.addColorStop(0, '#38bdf8');
    grad2.addColorStop(0.4, '#00f5ff88');
    grad2.addColorStop(1, '#0284c700');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(cx + dist, cy, 70, 0, Math.PI * 2);
    ctx.fill();

    // Phase 2 (0.4-0.8): Metallic chrome water drop & shockwave
    if (t >= 0.4) {
      const dropT = Math.min(1.0, (t - 0.4) / 0.35);
      const dropR = 24 * dropT;
      const dropGrad = ctx.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, dropR);
      dropGrad.addColorStop(0, '#ffffff');
      dropGrad.addColorStop(0.4, '#94a3b8');
      dropGrad.addColorStop(1, '#0284c7');

      ctx.save();
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 24 * dropT;
      ctx.fillStyle = dropGrad;
      ctx.beginPath();
      ctx.arc(cx, cy - 20, dropR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Phase 3 (0.55-1.0): Neon FLUIDCLEB INTERACTIVE Typography
    if (t >= 0.55) {
      const textT = Math.min(1.0, (t - 0.55) / 0.3);
      ctx.save();
      ctx.globalAlpha = textT;
      ctx.textAlign = 'center';

      // FLUIDCLEB
      ctx.font = '900 42px Montserrat, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 28;
      ctx.fillText('FLUIDCLEB', cx, cy + 45);

      // INTERACTIVE
      ctx.font = '700 13px Rajdhani, Montserrat, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.letterSpacing = '8px';
      ctx.shadowBlur = 12;
      ctx.fillText('INTERACTIVE', cx + 4, cy + 68);

      ctx.restore();
    }
  }
}
