/**
 * @fileoverview Cyberpunk Sci-Fi HUD & Input System for ShiftCore3D
 * Includes on-screen touch controls, gyroscope compass, modals, and GLX hot-reload hooks.
 */

import { i18n } from './i18n.js';
import { sound } from './audio.js';
import { crazyGames } from './crazygames.js';

export class GameHUD {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};

    this.hudEl = null;
    this.touchControlsEl = null;
    this.modalEl = null;

    this.coresTotal = 0;
    this.coresCollected = 0;
    this.currentSector = 1;
    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.gravityDir = 'DOWN';

    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    this.mount();
    this.setupListeners();
  }

  mount() {
    this.hudEl = document.createElement('div');
    this.hudEl.className = 'shiftcore-hud-overlay';
    this.hudEl.innerHTML = `
      <!-- Top Bar -->
      <div class="hud-top-bar">
        <!-- Left: Sector & Cores -->
        <div class="hud-group">
          <div class="hud-badge sector-badge" id="hud-sector-label">
            ${i18n.t('sector')} 1
          </div>
          <div class="hud-badge cores-badge">
            <span class="core-icon">◆</span>
            <span id="hud-cores-text">0 / 0</span>
          </div>
        </div>

        <!-- Center: Gravity Orientation Gyroscope -->
        <div class="hud-gravity-pill" id="hud-gravity-indicator" title="${i18n.t('gravity')}">
          <span class="gyro-arrow" id="gyro-arrow">▼</span>
          <span class="gyro-text" id="gyro-text">${i18n.t('dir_floor')}</span>
        </div>

        <!-- Right: Hull Health, Score, Audio & Pause -->
        <div class="hud-group">
          <!-- Hull Health Bar -->
          <div class="health-wrap" title="${i18n.t('health')}">
            <div class="health-bar-fill" id="hud-health-fill" style="width: 100%;"></div>
          </div>
          <div class="hud-score" id="hud-score-text">0</div>

          <!-- Mute Button -->
          <button class="hud-btn-icon" id="btn-toggle-sound" title="Sound">
            🔊
          </button>
          <!-- Pause Button -->
          <button class="hud-btn-icon" id="btn-toggle-pause" title="Pause">
            ⏸
          </button>
        </div>
      </div>

      <!-- Touch Controls Container for Mobile / Tablet -->
      <div class="hud-touch-controls" id="touch-controls">
        <!-- Left D-Pad: Left & Right Move -->
        <div class="touch-cluster-left">
          <button class="touch-btn" id="touch-btn-left">◀</button>
          <button class="touch-btn" id="touch-btn-right">▶</button>
        </div>

        <!-- Right Cluster: Jump & Gravity Rotators -->
        <div class="touch-cluster-right">
          <div class="touch-rotator-row">
            <button class="touch-btn touch-btn-alt" id="touch-btn-ccw" title="Rotate Left">⟲ Q</button>
            <button class="touch-btn touch-btn-alt" id="touch-btn-flip" title="Flip 180">↕ R</button>
            <button class="touch-btn touch-btn-alt" id="touch-btn-cw" title="Rotate Right">⟳ E</button>
          </div>
          <button class="touch-btn touch-btn-jump" id="touch-btn-jump">JUMP ⮝</button>
        </div>
      </div>

      <!-- Modal Container -->
      <div class="hud-modal-backdrop hidden" id="hud-modal">
        <div class="hud-modal-box" id="hud-modal-content"></div>
      </div>
    `;

    this.container.appendChild(this.hudEl);

    // Audio button click
    const soundBtn = this.hudEl.querySelector('#btn-toggle-sound');
    soundBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      soundBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    // Pause button click
    const pauseBtn = this.hudEl.querySelector('#btn-toggle-pause');
    pauseBtn.addEventListener('click', () => {
      if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
    });
  }

  setupListeners() {
    // Touch button bindings
    const bindTouch = (id, onStart, onEnd) => {
      const btn = this.hudEl.querySelector(`#${id}`);
      if (!btn) return;
      const start = (e) => {
        e.preventDefault();
        sound.playButtonClick();
        if (onStart) onStart();
      };
      const end = (e) => {
        e.preventDefault();
        if (onEnd) onEnd();
      };
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    };

    bindTouch('touch-btn-left', () => this.callbacks.onTouchInput?.('left', true), () => this.callbacks.onTouchInput?.('left', false));
    bindTouch('touch-btn-right', () => this.callbacks.onTouchInput?.('right', true), () => this.callbacks.onTouchInput?.('right', false));
    bindTouch('touch-btn-jump', () => this.callbacks.onTouchAction?.('jump'));
    bindTouch('touch-btn-ccw', () => this.callbacks.onTouchAction?.('rotateCCW'));
    bindTouch('touch-btn-cw', () => this.callbacks.onTouchAction?.('rotateCW'));
    bindTouch('touch-btn-flip', () => this.callbacks.onTouchAction?.('flip180'));

    // Dashboard GLX Hot-Reload & Remote postMessage handlers
    window.addEventListener('message', (ev) => {
      const data = ev.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'GLX_TUNE_PARAM') {
        console.log(`[HUD] Live Parameter Tune received: ${data.param} = ${data.value}`);
        if (this.callbacks.onTuneParam) {
          this.callbacks.onTuneParam(data.param, data.value);
        }
      }

      if (data.type === 'GLX_REMOTE_INPUT') {
        const cmd = data.command;
        console.log(`[HUD] Remote dual-screen command: ${cmd}`);
        switch (cmd) {
          case 'MOVE_LEFT':
            this.callbacks.onTouchInput?.('left', true);
            setTimeout(() => this.callbacks.onTouchInput?.('left', false), 250);
            break;
          case 'MOVE_RIGHT':
            this.callbacks.onTouchInput?.('right', true);
            setTimeout(() => this.callbacks.onTouchInput?.('right', false), 250);
            break;
          case 'JUMP':
            this.callbacks.onTouchAction?.('jump');
            break;
          case 'SHIFT_GRAVITY':
          case 'FLIP_180':
            this.callbacks.onTouchAction?.('flip180');
            break;
          case 'ROTATE_CW':
            this.callbacks.onTouchAction?.('rotateCW');
            break;
          case 'ROTATE_CCW':
            this.callbacks.onTouchAction?.('rotateCCW');
            break;
        }
      }

      if (data.type === 'CRAZYGAMES_AD_START') {
        sound.muteTemporarily();
      }
      if (data.type === 'CRAZYGAMES_AD_FINISHED') {
        sound.unmuteTemporarily();
      }
    });
  }

  updateStats(stats) {
    if (stats.sector !== undefined) {
      const lbl = this.hudEl.querySelector('#hud-sector-label');
      if (lbl) lbl.textContent = `${i18n.t('sector')} ${stats.sector}`;
    }
    if (stats.coresCollected !== undefined && stats.coresTotal !== undefined) {
      const cores = this.hudEl.querySelector('#hud-cores-text');
      if (cores) cores.textContent = `${stats.coresCollected} / ${stats.coresTotal}`;
    }
    if (stats.score !== undefined) {
      const score = this.hudEl.querySelector('#hud-score-text');
      if (score) score.textContent = stats.score.toLocaleString();
    }
    if (stats.health !== undefined && stats.maxHealth !== undefined) {
      const pct = Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100));
      const fill = this.hudEl.querySelector('#hud-health-fill');
      if (fill) {
        fill.style.width = `${pct}%`;
        fill.style.background = pct > 50 ? 'linear-gradient(90deg, #10b981, #06b6d4)' : pct > 25 ? '#f59e0b' : '#ef4444';
      }
    }
    if (stats.gravityDir) {
      const arrow = this.hudEl.querySelector('#gyro-arrow');
      const text = this.hudEl.querySelector('#gyro-text');
      const dirMap = {
        DOWN: { symbol: '▼', label: i18n.t('dir_floor') },
        UP: { symbol: '▲', label: i18n.t('dir_ceiling') },
        LEFT: { symbol: '◀', label: i18n.t('dir_left') },
        RIGHT: { symbol: '▶', label: i18n.t('dir_right') }
      };
      const info = dirMap[stats.gravityDir] || dirMap.DOWN;
      if (arrow) arrow.textContent = info.symbol;
      if (text) text.textContent = info.label;
    }
  }

  showVictoryModal(sector, score, onNext, onDoubleScore) {
    const modal = this.hudEl.querySelector('#hud-modal');
    const content = this.hudEl.querySelector('#hud-modal-content');
    modal.classList.remove('hidden');

    content.innerHTML = `
      <div class="modal-badge-success">✦ ${i18n.t('sector_complete')} ✦</div>
      <h2 class="modal-title">${i18n.t('sector')} ${sector} STABILIZED</h2>
      <p class="modal-subtitle">All Energy Cores secured. Warp Gate transit authorized.</p>
      <div class="modal-score-box">
        <span class="modal-score-label">${i18n.t('score')}</span>
        <span class="modal-score-value">${score.toLocaleString()}</span>
      </div>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-ad" id="btn-double-score">
          🎁 ${i18n.t('double_score')}
        </button>
        <button class="modal-btn modal-btn-primary" id="btn-next-sector">
          ${i18n.t('next_level')} ➔
        </button>
      </div>
    `;

    content.querySelector('#btn-next-sector').onclick = () => {
      sound.playButtonClick();
      modal.classList.add('hidden');
      if (onNext) onNext();
    };

    content.querySelector('#btn-double-score').onclick = () => {
      sound.playButtonClick();
      crazyGames.requestRewardedAd(() => {
        if (onDoubleScore) onDoubleScore();
        modal.classList.add('hidden');
        if (onNext) onNext();
      });
    };
  }

  showGameOverModal(onRetry, onRevive) {
    const modal = this.hudEl.querySelector('#hud-modal');
    const content = this.hudEl.querySelector('#hud-modal-content');
    modal.classList.remove('hidden');

    content.innerHTML = `
      <div class="modal-badge-danger">⚠️ ${i18n.t('game_over')}</div>
      <h2 class="modal-title">${i18n.t('game_over')}</h2>
      <p class="modal-subtitle">${i18n.t('game_over_desc')}</p>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-ad" id="btn-revive">
          🛡️ ${i18n.t('revive_btn')}
        </button>
        <button class="modal-btn modal-btn-secondary" id="btn-retry">
          🔄 ${i18n.t('restart')}
        </button>
      </div>
    `;

    content.querySelector('#btn-retry').onclick = () => {
      sound.playButtonClick();
      modal.classList.add('hidden');
      if (onRetry) onRetry();
    };

    content.querySelector('#btn-revive').onclick = () => {
      sound.playButtonClick();
      crazyGames.requestRewardedAd(() => {
        modal.classList.add('hidden');
        if (onRevive) onRevive();
      });
    };
  }

  showPauseModal(onResume, onRestart) {
    const modal = this.hudEl.querySelector('#hud-modal');
    const content = this.hudEl.querySelector('#hud-modal-content');
    modal.classList.remove('hidden');

    content.innerHTML = `
      <h2 class="modal-title">⏸ ${i18n.t('paused')}</h2>
      <p class="modal-subtitle">Station systems frozen.</p>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-primary" id="btn-resume">
          ▶ ${i18n.t('resume')}
        </button>
        <button class="modal-btn modal-btn-secondary" id="btn-restart-paused">
          🔄 ${i18n.t('restart')}
        </button>
      </div>
    `;

    content.querySelector('#btn-resume').onclick = () => {
      sound.playButtonClick();
      modal.classList.add('hidden');
      if (onResume) onResume();
    };

    content.querySelector('#btn-restart-paused').onclick = () => {
      sound.playButtonClick();
      modal.classList.add('hidden');
      if (onRestart) onRestart();
    };
  }

  hideModal() {
    const modal = this.hudEl.querySelector('#hud-modal');
    if (modal) modal.classList.add('hidden');
  }
}
