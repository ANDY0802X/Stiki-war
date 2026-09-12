import Phaser from 'phaser';
import { GAME_SETTINGS } from '../config/gameSettings.js';
import { CHARACTERS_CONFIG } from '../config/characters.config.js';
import { POWERS_CONFIG } from '../config/powers.config.js';
import { soundSynth } from '../audio/soundSynth.js';

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y);

    this.id = options.id || 'local-player';
    this.username = options.username || 'Brawler';
    this.isLocal = !!options.isLocal;
    this.colorIndex = options.colorIndex || 0;
    this.playerColor = GAME_SETTINGS.PLAYER_COLORS[this.colorIndex % GAME_SETTINGS.PLAYER_COLORS.length];

    // Character Archetype & Kit
    this.archetypeId = options.archetypeId || 'flame_puncher';
    this.archetype = CHARACTERS_CONFIG[this.archetypeId] || CHARACTERS_CONFIG.flame_puncher;
    this.power = POWERS_CONFIG[this.archetype.specialSkillId];

    // Combat & Physics State
    this.hp = GAME_SETTINGS.COMBAT.BASE_HP;
    this.maxHp = GAME_SETTINGS.COMBAT.BASE_HP;
    this.isDead = false;
    this.isInvincible = false;
    this.facing = 'right';
    this.currentAnim = 'idle';
    this.animLockTimer = 0; // Locks animation during attack/skill
    this.jumpCount = 0;
    this.maxJumps = 2; // Double Jump enabled
    this.isDroppingDown = false;
    this.dropDownTimer = 0;

    // Cooldowns & Timers
    this.lastDamageTime = 0;
    this.lastAttackTime = 0;
    this.skillCooldownRemaining = 0; // ms (7.0s max)
    this.respawnTimerRemaining = 0;  // ms (10.0s max)

    // Remote Interpolation Targets
    this.targetX = x;
    this.targetY = y;
    this.targetVx = 0;
    this.targetVy = 0;

    // Build visual components
    this.setupVisuals();

    // Enable Arcade Physics on Container
    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.body.setSize(38, 64);
    this.body.setOffset(-19, -32);
    this.body.setCollideWorldBounds(true);
    this.body.setDragX(GAME_SETTINGS.PHYSICS.GROUND_DRAG);
    this.body.setMaxVelocityY(GAME_SETTINGS.PHYSICS.MAX_FALL_SPEED);

    // Apply archetype gravity scaling
    this.body.setGravityY(GAME_SETTINGS.PHYSICS.GRAVITY_Y * this.archetype.gravityMultiplier);

    // Ground state tracking for landing squash and dust
    this.wasOnFloor = true;

    // Initial spawn invincibility bubble
    this.grantInvincibility(GAME_SETTINGS.COMBAT.SPAWN_INVINCIBILITY_SEC);
  }

  setupVisuals() {
    // 1. Ground Player Outline / Aura Ring (Identifies P1 to P6)
    this.auraRing = this.scene.add.graphics();
    this.auraRing.lineStyle(3, this.playerColor.phaserHex, 0.75);
    this.auraRing.strokeEllipse(0, 30, 32, 10);
    this.add(this.auraRing);

    // 2. Animated Character Sprite from character_assets.png
    this.sprite = this.scene.add.sprite(0, -2, `${this.archetypeId}_idle`);
    this.sprite.setDisplaySize(72, 82);
    this.sprite.setOrigin(0.5, 0.5);
    this.add(this.sprite);

    // 3. Invincibility Shield Bubble
    this.shield = this.scene.add.image(0, -2, 'shield_bubble');
    this.shield.setScale(1.35);
    this.shield.setVisible(false);
    this.add(this.shield);

    // 4. Overhead Nametag with Player Color
    this.nameText = this.scene.add.text(0, -48, this.username, {
      font: 'bold 12px sans-serif',
      fill: this.playerColor.hex,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // 5. Overhead Mini HP Bar
    this.hpBar = this.scene.add.graphics();
    this.add(this.hpBar);

    this.updateHpBar();
  }

  setFacing(dir) {
    if (this.facing !== dir) {
      this.facing = dir;
      this.sprite.setFlipX(dir === 'left');
    }
  }

  drawBody(animName) {
    this.playAnim(animName);
  }

  playAnim(animName, lockDurationMs = 0) {
    if (this.isDead) return;

    if (this.animLockTimer > 0 && animName !== 'hit' && animName !== 'death') {
      return; // Prioritize attack/skill anim
    }

    if (lockDurationMs > 0) {
      this.animLockTimer = lockDurationMs;
    }

    this.currentAnim = animName;
    const animKey = `${this.archetypeId}_${animName}`;

    if (this.scene.anims.exists(animKey)) {
      this.sprite.play(animKey, true);
    } else if (this.scene.textures.exists(animKey)) {
      this.sprite.setTexture(animKey);
    }

    this.sprite.setFlipX(this.facing === 'left');
  }

  updateHpBar() {
    this.hpBar.clear();
    const width = 44;
    const height = 5;
    const x = -width / 2;
    const y = -38;

    // Background container
    this.hpBar.fillStyle(0x000000, 0.75);
    this.hpBar.fillRoundedRect(x - 1, y - 1, width + 2, height + 2, 2);

    // Health Fill with dynamic color
    const ratio = Math.max(0, this.hp / this.maxHp);
    const color = ratio > 0.5 ? 0x2ed573 : ratio > 0.25 ? 0xffa502 : 0xff4757;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRoundedRect(x, y, width * ratio, height, 2);
  }

  grantInvincibility(seconds) {
    this.isInvincible = true;
    this.shield.setVisible(true);

    if (this.invincibleTimer) {
      this.invincibleTimer.remove();
    }

    this.invincibleTimer = this.scene.time.delayedCall(seconds * 1000, () => {
      this.isInvincible = false;
      this.shield.setVisible(false);
    });
  }

  takeDamage(amount, attackerX = 0, knockbackPower = 200) {
    if (this.isDead || this.isInvincible) return 0;

    this.hp = Math.max(0, this.hp - amount);
    this.lastDamageTime = this.scene.time.now;
    this.updateHpBar();

    // Hit reaction animation & flash
    this.playAnim('hit', 180);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.35,
      yoyo: true,
      duration: 60,
      repeat: 1
    });

    // Hit sparks & camera micro-kick for tactile realism
    if (this.scene?.textures.exists('particle_spark')) {
      const spark = this.scene.add.particles(this.x, this.y - 10, 'particle_spark', {
        speed: { min: 90, max: 240 },
        scale: { start: 1.1, end: 0 },
        lifespan: 180,
        quantity: 7
      });
      this.scene.time.delayedCall(200, () => spark.destroy());
    }

    if (this.scene?.cameras?.main) {
      this.scene.cameras.main.shake(70, 0.007);
    }

    // Knockback
    const knockDir = this.x >= attackerX ? 1 : -1;
    this.body.setVelocityX(knockDir * knockbackPower);
    this.body.setVelocityY(-knockbackPower * 0.55);

    // Floating damage indicator
    this.showDamageText(amount);

    if (this.hp <= 0) {
      this.die();
    }

    return amount;
  }

  showDamageText(amount) {
    const txt = this.scene.add.text(this.x, this.y - 30, `-${Math.round(amount)}`, {
      font: 'bold 16px sans-serif',
      fill: '#ff4757',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5);

    this.scene.tweens.add({
      targets: txt,
      y: this.y - 70,
      alpha: 0,
      duration: 650,
      ease: 'Power1',
      onComplete: () => txt.destroy()
    });
  }

  die() {
    this.isDead = true;
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    this.playAnim('death');

    soundSynth.playDeath();

    // Character specific death particle explosion
    const pKey = this.archetypeId === 'flame_puncher' ? 'particle_fire' :
                 this.archetypeId === 'ice_speedster' ? 'particle_ice' :
                 this.archetypeId === 'void_thrower' ? 'particle_void' : 'particle_sword';

    const emitter = this.scene.add.particles(this.x, this.y, pKey, {
      speed: { min: 80, max: 220 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 550,
      quantity: 16
    });
    this.scene.time.delayedCall(600, () => {
      emitter.destroy();
      this.setVisible(false);
    });

    // 10-Second Respawn Countdown
    this.respawnTimerRemaining = GAME_SETTINGS.COMBAT.RESPAWN_DELAY_SEC * 1000;
  }

  respawn(x, y, newArchetypeId) {
    this.isDead = false;
    this.hp = this.maxHp;
    this.setPosition(x, y);
    this.body.enable = true;
    this.body.setVelocity(0, 0);
    this.setVisible(true);

    if (newArchetypeId && CHARACTERS_CONFIG[newArchetypeId]) {
      this.archetypeId = newArchetypeId;
      this.archetype = CHARACTERS_CONFIG[newArchetypeId];
      this.power = POWERS_CONFIG[this.archetype.specialSkillId];
      this.body.setGravityY(GAME_SETTINGS.PHYSICS.GRAVITY_Y * this.archetype.gravityMultiplier);
      this.sprite.setTexture(`${this.archetypeId}_idle`);
    }

    this.playAnim('idle');
    this.updateHpBar();
    this.grantInvincibility(GAME_SETTINGS.COMBAT.SPAWN_INVINCIBILITY_SEC);
  }

  update(time, delta) {
    if (this.isDead) {
      if (this.respawnTimerRemaining > 0) {
        this.respawnTimerRemaining -= delta;
      }
      return;
    }

    // Animation Lock Timer countdown
    if (this.animLockTimer > 0) {
      this.animLockTimer -= delta;
    }

    // Dynamic Health Regeneration (+2 HP/s in combat, +10 HP/s after 2s safe)
    const timeSinceDamage = time - this.lastDamageTime;
    const isSafe = timeSinceDamage >= GAME_SETTINGS.COMBAT.REGEN_RAMP_DELAY_MS;
    const regenRate = isSafe ? GAME_SETTINGS.COMBAT.REGEN_RAMP_RATE : GAME_SETTINGS.COMBAT.PASSIVE_REGEN_RATE;

    if (this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + (regenRate * (delta / 1000)));
      this.updateHpBar();
    }

    // Skill Cooldown Timer (7.0s base)
    if (this.skillCooldownRemaining > 0) {
      this.skillCooldownRemaining = Math.max(0, this.skillCooldownRemaining - delta);
    }

    // Platform Drop-Down Timer
    if (this.isDroppingDown) {
      this.dropDownTimer -= delta;
      if (this.dropDownTimer <= 0) {
        this.isDroppingDown = false;
      }
    }

    // Ground reset for double jumps and landing impact
    const onFloor = this.body.touching.down || this.body.blocked.down;
    if (onFloor) {
      if (!this.wasOnFloor && Math.abs(this.body.velocity.y) < 80) {
        // Landing squash and dust
        this.spawnDust(5);
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.14,
          scaleY: 0.88,
          duration: 65,
          yoyo: true,
          ease: 'Quad.easeOut'
        });
      }
      this.jumpCount = 0;
    }
    this.wasOnFloor = onFloor;

    // Update animations based on movement state
    if (this.animLockTimer <= 0) {
      if (!onFloor) {
        this.playAnim('jump');
      } else if (Math.abs(this.body.velocity.x) > 20) {
        this.playAnim('run');
      } else {
        this.playAnim('idle');
      }
    }

    // Remote Player Interpolation (Lerp)
    if (!this.isLocal) {
      this.x = Phaser.Math.Linear(this.x, this.targetX, GAME_SETTINGS.NETWORK.CLIENT_LERP_FACTOR);
      this.y = Phaser.Math.Linear(this.y, this.targetY, GAME_SETTINGS.NETWORK.CLIENT_LERP_FACTOR);
      if (Math.abs(this.targetVx) > 20) {
        this.setFacing(this.targetVx > 0 ? 'right' : 'left');
      }
    }
  }

  // Execute Basic Strike with character animation and particles
  executeAttack() {
    if (this.isDead) return null;
    const now = this.scene.time.now;
    if (now - this.lastAttackTime < GAME_SETTINGS.COMBAT.BASIC_ATTACK_COOLDOWN_MS) {
      return null;
    }
    this.lastAttackTime = now;
    soundSynth.playPunch();

    this.playAnim('attack', 220);

    const dir = this.facing === 'right' ? 1 : -1;
    const range = this.archetype.attackRange;

    // Spawn character-specific strike particles
    const pKey = this.archetypeId === 'flame_puncher' ? 'particle_fire' :
                 this.archetypeId === 'ice_speedster' ? 'particle_ice' :
                 this.archetypeId === 'void_thrower' ? 'particle_void' : 'particle_sword';

    const p = this.scene.add.particles(this.x + 24 * dir, this.y - 4, pKey, {
      speed: { min: 40, max: 120 },
      scale: { start: 0.8, end: 0 },
      lifespan: 250,
      quantity: 5
    });
    this.scene.time.delayedCall(260, () => p.destroy());

    return {
      x: this.x + (range / 2) * dir,
      y: this.y - 4,
      width: range,
      height: 44,
      damage: this.archetype.attackDamage,
      knockback: 260
    };
  }

  // Execute Special Power (7.0s Cooldown)
  executeSkill() {
    if (this.isDead || this.skillCooldownRemaining > 0) return null;

    this.skillCooldownRemaining = GAME_SETTINGS.COMBAT.SKILL_COOLDOWN_SEC * 1000;
    this.playAnim('skill', 450);

    const dir = this.facing === 'right' ? 1 : -1;

    switch (this.archetype.specialSkillId) {
      case 'flame_surge':
        soundSynth.playFlameSurge();
        this.body.setVelocityX(dir * this.power.lungeSpeed);
        this.spawnSkillParticles('particle_fire', 18);
        return {
          type: 'flame_surge',
          x: this.x + 40 * dir,
          y: this.y,
          width: 85,
          height: 55,
          damage: this.power.damage,
          knockback: this.power.knockback
        };

      case 'frost_dash':
        soundSynth.playFrostDash();
        this.body.setVelocityX(dir * this.power.dashSpeed);
        this.spawnSkillParticles('particle_ice', 18);
        return {
          type: 'frost_dash',
          x: this.x,
          y: this.y,
          width: 95,
          height: 45,
          damage: this.power.damage,
          knockback: 180,
          slow: true
        };

      case 'singularity_vortex':
        soundSynth.playVoidCast();
        this.spawnSkillParticles('particle_void', 20);
        return {
          type: 'singularity_vortex',
          x: this.x + 100 * dir,
          y: this.y - 20,
          radius: this.power.vortexRadius,
          damage: this.power.damage,
          knockback: 220
        };

      case 'blade_whirlwind':
        soundSynth.playBladeSlash();
        this.spawnSkillParticles('particle_sword', 22);
        return {
          type: 'blade_whirlwind',
          x: this.x,
          y: this.y,
          radius: this.power.radius,
          damage: this.power.damage,
          knockback: 340
        };

      default:
        return null;
    }
  }

  spawnSkillParticles(textureKey, count = 16) {
    const emitter = this.scene.add.particles(this.x, this.y, textureKey, {
      speed: { min: 60, max: 200 },
      scale: { start: 1.1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 450,
      quantity: count
    });
    this.scene.time.delayedCall(460, () => emitter.destroy());
  }

  spawnDust(count = 4) {
    if (!this.scene?.textures.exists('particle_dust')) return;
    const dust = this.scene.add.particles(this.x, this.y + 26, 'particle_dust', {
      speed: { min: 30, max: 90 },
      angle: { min: 180, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.65, end: 0 },
      lifespan: 220,
      quantity: count
    });
    this.scene.time.delayedCall(240, () => dust.destroy());
  }
}
