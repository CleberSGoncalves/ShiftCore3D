/**
 * @fileoverview 3D Isometric & Sci-Fi Canvas Renderer for ShiftCore3D
 * High-performance, pixel-sharp, responsive rendering with lighting & particles.
 */

export class Renderer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = 48; // Base pixel grid size

    // Stars background
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2.0 + 0.6,
        alpha: Math.random() * 0.7 + 0.3,
        blinkSpeed: Math.random() * 2.0 + 1.0,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.time = 0;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    if (this.canvas.width !== w * dpr || this.canvas.height !== h * dpr) {
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.resetTransform();
      this.ctx.scale(dpr, dpr);
    }
    return { width: w, height: h };
  }

  render(level, player, particles, shaker, dt) {
    this.time += dt;
    const { width, height } = this.resize();
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Deep Space Cosmic Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#00050f');
    bgGrad.addColorStop(0.5, '#02091a');
    bgGrad.addColorStop(1, '#050212');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Twinkling stars
    for (const star of this.stars) {
      const alpha = star.alpha * (0.6 + 0.4 * Math.sin(this.time * star.blinkSpeed + star.phase));
      ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
      ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
    }

    // 2. Camera Calculation (Player Centered + Shake)
    // Dynamic tile size based on screen viewport
    const fitTileW = width / (level.width + 2);
    const fitTileH = height / (level.height + 2);
    this.tileSize = Math.max(28, Math.min(60, Math.min(fitTileW, fitTileH) * 1.15));

    const cx = (player.x + player.w * 0.5) * this.tileSize;
    const cy = (player.y + player.h * 0.5) * this.tileSize;

    ctx.save();
    // Center view
    ctx.translate(width / 2 + shaker.offsetX, height / 2 + shaker.offsetY);
    ctx.rotate(shaker.angle);
    ctx.translate(-cx, -cy);

    // 3. Render Station Level Blocks
    for (const b of level.blocks) {
      this.drawBlock(ctx, b);
    }

    // 4. Render Lasers
    for (const laser of level.lasers) {
      this.drawLaser(ctx, laser);
    }

    // 5. Render Energy Cores
    for (const core of level.cores) {
      if (!core.collected) {
        this.drawCore(ctx, core);
      }
    }

    // 6. Render Warp Portal
    this.drawPortal(ctx, level.portal, level.cores.every(c => c.collected));

    // 7. Render Particles
    particles.draw(ctx);

    // 8. Render Cubo-Naut Player
    this.drawPlayer(ctx, player);

    ctx.restore();
    ctx.restore();
  }

  drawBlock(ctx, b) {
    const px = b.x * this.tileSize;
    const py = b.y * this.tileSize;
    const pw = b.w * this.tileSize;
    const ph = b.h * this.tileSize;
    const depth = 6;

    if (b.type === 'solid') {
      // Sci-Fi Metallic Hull
      ctx.save();

      // Shadow / 3D Extrusion
      ctx.fillStyle = '#060e20';
      ctx.fillRect(px, py + depth, pw, ph);

      // Main Face
      const grad = ctx.createLinearGradient(px, py, px, py + ph);
      grad.addColorStop(0, '#13233e');
      grad.addColorStop(1, '#0b1626');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, pw, ph);

      // Neon Rim Highlight
      ctx.strokeStyle = '#00f5ff33';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

      // Circuit grid lines inside block
      ctx.strokeStyle = '#00f5ff15';
      ctx.lineWidth = 1;
      for (let ix = px + this.tileSize; ix < px + pw; ix += this.tileSize) {
        ctx.beginPath();
        ctx.moveTo(ix, py);
        ctx.lineTo(ix, py + ph);
        ctx.stroke();
      }
      for (let iy = py + this.tileSize; iy < py + ph; iy += this.tileSize) {
        ctx.beginPath();
        ctx.moveTo(px, iy);
        ctx.lineTo(px + pw, iy);
        ctx.stroke();
      }

      ctx.restore();
    } else if (b.type === 'plasma') {
      // Deadly Plasma / Hazard Spikes
      ctx.save();
      const pulse = 0.7 + 0.3 * Math.sin(this.time * 6.0);
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 12 * pulse;

      ctx.fillStyle = '#2a0312';
      ctx.fillRect(px, py, pw, ph);

      // Spikes
      const spikeCount = Math.floor(pw / 16);
      const spikeW = pw / spikeCount;
      ctx.fillStyle = `rgba(255, 0, 85, ${pulse})`;
      ctx.beginPath();
      for (let i = 0; i < spikeCount; i++) {
        const sx = px + i * spikeW;
        ctx.moveTo(sx, py + ph);
        ctx.lineTo(sx + spikeW * 0.5, py + 2);
        ctx.lineTo(sx + spikeW, py + ph);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  drawLaser(ctx, laser) {
    const lx = (laser.x + 0.5) * this.tileSize;
    const ly1 = laser.y1 * this.tileSize;
    const ly2 = (laser.y2 + 1) * this.tileSize;

    // Laser pulsing cycle
    const cycle = (this.time + laser.offset) % laser.period;
    const isActive = cycle < laser.period * 0.65;

    ctx.save();
    // Emitters at ends
    ctx.fillStyle = '#64748b';
    ctx.fillRect(lx - 6, ly1, 12, 6);
    ctx.fillRect(lx - 6, ly2 - 6, 12, 6);

    if (isActive) {
      const beamPulse = 0.8 + 0.2 * Math.sin(this.time * 24.0);
      ctx.shadowColor = '#ff2255';
      ctx.shadowBlur = 16 * beamPulse;

      // Outer glow
      ctx.strokeStyle = `rgba(255, 34, 85, ${0.4 * beamPulse})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(lx, ly1 + 6);
      ctx.lineTo(lx, ly2 - 6);
      ctx.stroke();

      // Core hot beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly1 + 6);
      ctx.lineTo(lx, ly2 - 6);
      ctx.stroke();
    } else {
      // Laser charging warning dots
      const warnAlpha = 0.3 + 0.3 * Math.sin(this.time * 12.0);
      ctx.strokeStyle = `rgba(255, 100, 100, ${warnAlpha})`;
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly1 + 6);
      ctx.lineTo(lx, ly2 - 6);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawCore(ctx, core) {
    const cx = (core.x + 0.5) * this.tileSize;
    const bob = Math.sin(this.time * 3.5 + core.x) * 6;
    const cy = (core.y + 0.5) * this.tileSize + bob;
    const size = this.tileSize * 0.36;

    ctx.save();
    ctx.translate(cx, cy);

    // Corona aura
    const pulse = 0.8 + 0.2 * Math.sin(this.time * 5.0);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 2.2);
    grad.addColorStop(0, 'rgba(0, 245, 255, 0.55)');
    grad.addColorStop(0.5, 'rgba(0, 245, 255, 0.15)');
    grad.addColorStop(1, 'rgba(0, 245, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, size * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Rotating 3D crystal (Octahedron simulation)
    const rot = this.time * 2.2;
    ctx.rotate(rot);
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 14 * pulse;

    // Diamond 1
    ctx.fillStyle = '#00f5ff';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.75, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.75, 0);
    ctx.closePath();
    ctx.fill();

    // Facet lighting
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.75, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawPortal(ctx, portal, isOpen) {
    const cx = (portal.x + 0.5) * this.tileSize;
    const cy = (portal.y + 0.5) * this.tileSize;
    const r = this.tileSize * 0.65;

    ctx.save();
    ctx.translate(cx, cy);

    if (isOpen) {
      // Swirling Active Vortex
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 24;

      for (let i = 0; i < 3; i++) {
        const ringR = r * (0.5 + i * 0.25);
        ctx.strokeStyle = i % 2 === 0 ? '#00f5ff' : '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const angleOffset = this.time * (i === 1 ? -3 : 2.5);
        ctx.arc(0, 0, ringR, angleOffset, angleOffset + Math.PI * 1.5);
        ctx.stroke();
      }

      // Center glowing core
      const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.6);
      centerGrad.addColorStop(0, '#ffffff');
      centerGrad.addColorStop(0.4, '#38bdf8');
      centerGrad.addColorStop(1, '#6366f100');
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Locked Portal Gate Frame
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Lock icon / exclamation
      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold ${Math.round(r * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', 0, 0);
    }

    ctx.restore();
  }

  drawPlayer(ctx, player) {
    const px = (player.x + player.w * 0.5) * this.tileSize;
    const py = (player.y + player.h * 0.5) * this.tileSize;
    const pw = player.w * this.tileSize;
    const ph = player.h * this.tileSize;

    ctx.save();
    ctx.translate(px, py);

    // Rotate to match gravity
    ctx.rotate(player.currentRotation);

    // Squash & Stretch
    ctx.scale(player.scaleX, player.scaleY);

    // Damage flicker
    if (player.invulnerableTimer > 0) {
      const flicker = Math.floor(player.invulnerableTimer * 20) % 2 === 0;
      if (flicker) {
        ctx.restore();
        return;
      }
    }

    // Quantum Shield Aura (Rewarded Ad)
    if (player.hasQuantumShield) {
      ctx.save();
      const shieldPulse = 0.8 + 0.2 * Math.sin(this.time * 8.0);
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 18 * shieldPulse;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, pw * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Cubo-Naut Body (High-Tech Rounded Cube)
    const r = 8;
    const hw = pw * 0.46;
    const hh = ph * 0.46;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-hw, -hh + 5, hw * 2, hh * 2);

    // Robot Hull
    const hullGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    hullGrad.addColorStop(0, '#e2e8f0');
    hullGrad.addColorStop(0.5, '#94a3b8');
    hullGrad.addColorStop(1, '#475569');
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, r);
    ctx.fill();

    // Cyberpunk Neon Chamfer Outline
    ctx.strokeStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Robotic Visor / Eye
    const visorW = hw * 1.3;
    const visorH = hh * 0.45;
    ctx.fillStyle = '#050c18';
    ctx.fillRect(-visorW * 0.5, -hh * 0.35, visorW, visorH);

    // Glowing Cyan Eye looking in movement direction
    const eyeLook = Math.max(-4, Math.min(4, player.vx * 0.8));
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(-visorW * 0.35 + eyeLook, -hh * 0.25, visorW * 0.7, visorH * 0.55);

    // Gravitational Core Ring on chest
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, hh * 0.45, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
