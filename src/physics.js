/**
 * @fileoverview Physics, Gravity Shifter & Juice System for ShiftCore3D
 * Compliant with game-juice-and-feel guidelines:
 * - Exponential Trauma Screen Shake
 * - Hit-Stop micro-freezes
 * - Squash & Stretch elastic spring
 * - Coyote Time (0.12s) & Jump Buffering (0.15s)
 * - Multi-axis Gravity Transitions
 */

export class CameraShaker {
  constructor() {
    this.trauma = 0;
    this.decay = 1.6;
    this.maxOffset = 18;
    this.maxAngle = 0.06;
    this.offsetX = 0;
    this.offsetY = 0;
    this.angle = 0;
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(dt) {
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.decay * dt);
      const shake = this.trauma * this.trauma;
      this.offsetX = (Math.random() * 2 - 1) * this.maxOffset * shake;
      this.offsetY = (Math.random() * 2 - 1) * this.maxOffset * shake;
      this.angle = (Math.random() * 2 - 1) * this.maxAngle * shake;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.angle = 0;
    }
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count = 12, color = '#00f5ff', speed = 120, life = 0.6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.9);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: 2.5 + Math.random() * 3.5,
        life,
        maxLife: life,
        decay: 1.0 / life
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      const alpha = progress * progress; // Non-linear fade
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * progress, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export class PlayerPhysics {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = 0.85; // Grid units
    this.h = 0.85;

    // Movement tuning (Hot-reloadable)
    this.speedMultiplier = 1.0;
    this.jumpMultiplier = 1.0;
    this.gravityMultiplier = 1.0;

    this.baseSpeed = 7.5;
    this.baseJump = 12.5;
    this.baseGravity = 28.0;

    // Gravity State: 'DOWN', 'UP', 'LEFT', 'RIGHT'
    this.gravityDir = 'DOWN';
    this.targetRotation = 0; // Radians
    this.currentRotation = 0;

    // Coyote & Buffer
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

    // Squash & Stretch
    this.scaleX = 1.0;
    this.scaleY = 1.0;

    // Invulnerability after damage/revive
    this.invulnerableTimer = 0;
    this.hasQuantumShield = false;
  }

  setGravity(newDir) {
    if (this.gravityDir === newDir) return false;
    this.gravityDir = newDir;
    switch (newDir) {
      case 'DOWN':
        this.targetRotation = 0;
        break;
      case 'RIGHT':
        this.targetRotation = -Math.PI / 2;
        break;
      case 'UP':
        this.targetRotation = Math.PI;
        break;
      case 'LEFT':
        this.targetRotation = Math.PI / 2;
        break;
    }
    // Small impulse opposite to old velocity
    this.vx *= 0.5;
    this.vy *= 0.5;
    return true;
  }

  rotateCW() {
    const cycle = ['DOWN', 'LEFT', 'UP', 'RIGHT'];
    const idx = cycle.indexOf(this.gravityDir);
    return this.setGravity(cycle[(idx + 1) % 4]);
  }

  rotateCCW() {
    const cycle = ['DOWN', 'RIGHT', 'UP', 'LEFT'];
    const idx = cycle.indexOf(this.gravityDir);
    return this.setGravity(cycle[(idx + 1) % 4]);
  }

  flip180() {
    const opp = { DOWN: 'UP', UP: 'DOWN', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    return this.setGravity(opp[this.gravityDir]);
  }

  triggerJump() {
    this.jumpBufferTimer = 0.15; // Buffer for 150ms
  }

  update(dt, inputDir, blocks) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Smooth rotation towards target rotation
    let diff = this.targetRotation - this.currentRotation;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentRotation += diff * Math.min(1.0, dt * 14.0);

    // Spring damping for squash & stretch
    this.scaleX += (1.0 - this.scaleX) * 12.0 * dt;
    this.scaleY += (1.0 - this.scaleY) * 12.0 * dt;

    // Coyote & Buffer timers
    if (this.onGround) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    const gravAcc = this.baseGravity * this.gravityMultiplier;
    const moveSpd = this.baseSpeed * this.speedMultiplier;
    const jumpSpd = this.baseJump * this.jumpMultiplier;

    // Apply acceleration according to gravity direction
    let ax = 0, ay = 0;
    let jumpRequested = (this.jumpBufferTimer > 0 && this.coyoteTimer > 0);

    switch (this.gravityDir) {
      case 'DOWN':
        ay += gravAcc;
        ax = inputDir * moveSpd;
        this.vx += (ax - this.vx) * 16.0 * dt;
        if (jumpRequested) {
          this.vy = -jumpSpd;
          this.executeJumpSquash();
        }
        break;

      case 'UP':
        ay -= gravAcc;
        ax = inputDir * moveSpd;
        this.vx += (ax - this.vx) * 16.0 * dt;
        if (jumpRequested) {
          this.vy = jumpSpd;
          this.executeJumpSquash();
        }
        break;

      case 'LEFT':
        ax -= gravAcc;
        ay = -inputDir * moveSpd; // Inverted for intuitive vertical climb
        this.vy += (ay - this.vy) * 16.0 * dt;
        if (jumpRequested) {
          this.vx = jumpSpd;
          this.executeJumpSquash();
        }
        break;

      case 'RIGHT':
        ax += gravAcc;
        ay = inputDir * moveSpd;
        this.vy += (ay - this.vy) * 16.0 * dt;
        if (jumpRequested) {
          this.vx = -jumpSpd;
          this.executeJumpSquash();
        }
        break;
    }

    this.vx += ax * dt;
    this.vy += ay * dt;

    // Collision Detection and Resolution (AABB against blocks)
    this.onGround = false;

    // Horizontal Movement
    this.x += this.vx * dt;
    for (const b of blocks) {
      if (b.type === 'solid' && this.checkOverlap(this.x, this.y, b)) {
        if (this.vx > 0) {
          this.x = b.x - this.w;
          if (this.gravityDir === 'RIGHT') this.onGround = true;
        } else if (this.vx < 0) {
          this.x = b.x + b.w;
          if (this.gravityDir === 'LEFT') this.onGround = true;
        }
        this.vx = 0;
      }
    }

    // Vertical Movement
    this.y += this.vy * dt;
    for (const b of blocks) {
      if (b.type === 'solid' && this.checkOverlap(this.x, this.y, b)) {
        if (this.vy > 0) {
          this.y = b.y - this.h;
          if (this.gravityDir === 'DOWN') {
            if (!this.onGround) this.executeLandSquash();
            this.onGround = true;
          }
        } else if (this.vy < 0) {
          this.y = b.y + b.h;
          if (this.gravityDir === 'UP') {
            if (!this.onGround) this.executeLandSquash();
            this.onGround = true;
          }
        }
        this.vy = 0;
      }
    }
  }

  executeJumpSquash() {
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.scaleX = 0.75;
    this.scaleY = 1.35;
  }

  executeLandSquash() {
    this.scaleX = 1.35;
    this.scaleY = 0.72;
  }

  checkOverlap(x, y, block) {
    return (
      x < block.x + block.w &&
      x + this.w > block.x &&
      y < block.y + block.h &&
      y + this.h > block.y
    );
  }
}
