import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { GAME_SETTINGS } from '../config/gameSettings.js';
import { MAPS_CONFIG, MAP_ROTATION_ORDER } from '../config/maps.config.js';
import { CHARACTER_KEYS, CHARACTERS_CONFIG } from '../config/characters.config.js';
import { soundSynth } from '../audio/soundSynth.js';

export default class ArenaScene extends Phaser.Scene {
  constructor() {
    super('ArenaScene');
  }

  init(data) {
    this.socket = data?.socket || null;
    this.username = data?.username || 'Brawler';
    this.userColor = data?.userColor || '#38bdf8';
    this.onHudUpdate = data?.onHudUpdate || (() => {});

    // Active Map Rotation (Map 1 -> Map 2 -> Map 3 -> Map 1)
    this.activeMapIndex = 0;
    this.activeMapConfig = MAPS_CONFIG[MAP_ROTATION_ORDER[this.activeMapIndex]];
    this.mapTimerRemainingSec = GAME_SETTINGS.COMBAT.MAP_ROTATION_SEC;

    // Player instances
    this.localPlayer = null;
    this.remotePlayers = new Map();
    this.testDummy = null; // Solo testing dummy
    this.soloMode = true;

    // Scoreboard
    this.scores = {
      kills: 0,
      deaths: 0
    };

    // Network throttle
    this.lastNetworkEmit = 0;
  }

  create() {
    // 1. Build Arena Background & Platforms
    this.buildMap(this.activeMapConfig);

    // 2. Spawn Local Player with Random Mystery Character
    const initialCharacter = this.getRandomCharacter();
    const spawnPos = this.getRandomSpawnPoint();
    this.localPlayer = new Player(this, spawnPos.x, spawnPos.y, {
      id: this.socket?.id || 'local-player',
      username: this.username,
      isLocal: true,
      colorIndex: 0,
      archetypeId: initialCharacter
    });

    // 3. Setup Collisions
    this.setupCollisions();

    // 4. Input Listeners
    this.setupInputs();

    // 5. Spawn Solo Practice Dummy for immediate testing
    this.spawnTestDummy();

    // 6. Network Listeners
    if (this.socket) {
      this.setupSocketEvents();
    }

    // 7. 5-Minute Map Rotation Timer
    this.time.addEvent({
      delay: 1000,
      callback: this.tickMapTimer,
      callbackScope: this,
      loop: true
    });
  }

  getRandomCharacter() {
    return CHARACTER_KEYS[Math.floor(Math.random() * CHARACTER_KEYS.length)];
  }

  getRandomSpawnPoint() {
    const spawns = this.activeMapConfig.spawns;
    return spawns[Math.floor(Math.random() * spawns.length)];
  }

  buildMap(config) {
    // Clean up previous map objects if any
    if (this.bgImage) this.bgImage.destroy();
    if (this.solidsGroup) this.solidsGroup.clear(true, true);
    if (this.platformsGroup) this.platformsGroup.clear(true, true);
    if (this.hazardsGroup) this.hazardsGroup.clear(true, true);

    // Arena background (1280x720 16:9 fixed)
    this.bgImage = this.add.image(640, 360, config.bgKey);
    this.bgImage.setDisplaySize(1280, 720);
    this.bgImage.setDepth(-10);

    // Solid Cliffs & Enclosing Walls
    this.solidsGroup = this.physics.add.staticGroup();
    config.solids.forEach((s) => {
      const rect = this.add.rectangle(s.x, s.y, s.width, s.height, 0x000000, 0);
      this.physics.add.existing(rect, true);
      this.solidsGroup.add(rect);
    });

    // Semi-Solid Jump-Through Platforms
    this.platformsGroup = this.physics.add.staticGroup();
    config.platforms.forEach((p) => {
      const rect = this.add.rectangle(p.x, p.y, p.width, p.height, 0x000000, 0);
      this.physics.add.existing(rect, true);
      // Allow jumping through from below (one-way)
      rect.body.checkCollision.down = false;
      rect.body.checkCollision.left = false;
      rect.body.checkCollision.right = false;
      this.platformsGroup.add(rect);
    });

    // Hazards (Lava / Spikes)
    this.hazardsGroup = this.physics.add.staticGroup();
    config.hazards.forEach((h) => {
      const hazardZone = this.add.rectangle(h.x, h.y, h.width, h.height, h.color, 0.15);
      this.physics.add.existing(hazardZone, true);
      hazardZone.hazardData = h;
      this.hazardsGroup.add(hazardZone);
    });
  }

  setupCollisions() {
    // Collide with solid cliffs
    this.physics.add.collider(this.localPlayer, this.solidsGroup);

    // Collide with semi-solid platforms (with Drop-Down check)
    this.physics.add.collider(
      this.localPlayer,
      this.platformsGroup,
      null,
      (player) => !player.isDroppingDown,
      this
    );

    // Overlap with Hazards
    this.physics.add.overlap(
      this.localPlayer,
      this.hazardsGroup,
      this.handleHazardOverlap,
      null,
      this
    );
  }

  setupInputs() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      J: Phaser.Input.Keyboard.KeyCodes.J,
      K: Phaser.Input.Keyboard.KeyCodes.K,
      E: Phaser.Input.Keyboard.KeyCodes.E
    });

    // Pointer clicks for attack and skill
    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.triggerLocalAttack();
      } else if (pointer.rightButtonDown()) {
        this.triggerLocalSkill();
      }
    });

    // Prevent right click browser context menu
    this.input.mouse?.disableContextMenu();
  }

  spawnTestDummy() {
    // Practice dummy for instant solo testing
    const spawnPos = this.activeMapConfig.spawns[1] || { x: 800, y: 400 };
    this.testDummy = new Player(this, spawnPos.x, spawnPos.y, {
      id: 'practice-dummy',
      username: 'Practice Dummy',
      isLocal: false,
      colorIndex: 3,
      archetypeId: 'sword_fighter'
    });

    this.physics.add.collider(this.testDummy, this.solidsGroup);
    this.physics.add.collider(this.testDummy, this.platformsGroup);
  }

  handleHazardOverlap(player, hazardZone) {
    if (player.isDead || player.isInvincible) return;

    const data = hazardZone.hazardData;
    const now = this.time.now;

    if (!player.lastHazardHit || now - player.lastHazardHit > 600) {
      player.lastHazardHit = now;
      soundSynth.playHazardHurt();

      if (data.type === 'lava') {
        player.takeDamage(data.instantDamage, player.x, 150);
      } else if (data.type === 'spike') {
        player.takeDamage(data.instantDamage, player.x, 150);
        player.body.setVelocityY(data.bounceImpulseY || -380);
      }
    }
  }

  triggerLocalAttack() {
    if (!this.localPlayer || this.localPlayer.isDead) return;

    const hitbox = this.localPlayer.executeAttack();
    if (!hitbox) return;

    // Check hit against test dummy
    if (this.testDummy && !this.testDummy.isDead) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(
        new Phaser.Geom.Rectangle(hitbox.x - hitbox.width / 2, hitbox.y - hitbox.height / 2, hitbox.width, hitbox.height),
        new Phaser.Geom.Rectangle(this.testDummy.x - 17, this.testDummy.y - 29, 34, 58)
      )) {
        const dmg = this.testDummy.takeDamage(hitbox.damage, this.localPlayer.x, hitbox.knockback);
        if (dmg > 0 && this.testDummy.isDead) {
          this.scores.kills++;
          this.time.delayedCall(4000, () => {
            const sp = this.getRandomSpawnPoint();
            this.testDummy.respawn(sp.x, sp.y, this.getRandomCharacter());
          });
        }
      }
    }

    // Check hit against remote players
    this.remotePlayers.forEach((remote) => {
      if (!remote.isDead && !remote.isInvincible) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(
          new Phaser.Geom.Rectangle(hitbox.x - hitbox.width / 2, hitbox.y - hitbox.height / 2, hitbox.width, hitbox.height),
          new Phaser.Geom.Rectangle(remote.x - 17, remote.y - 29, 34, 58)
        )) {
          remote.takeDamage(hitbox.damage, this.localPlayer.x, hitbox.knockback);
          if (this.socket) {
            this.socket.emit('player_hit', {
              targetId: remote.id,
              damage: hitbox.damage,
              attackerX: this.localPlayer.x
            });
          }
        }
      }
    });

    if (this.socket) {
      this.socket.emit('player_attack', { x: this.localPlayer.x, y: this.localPlayer.y });
    }
  }

  triggerLocalSkill() {
    if (!this.localPlayer || this.localPlayer.isDead) return;

    const skillResult = this.localPlayer.executeSkill();
    if (!skillResult) return;

    // Particle FX based on skill
    if (skillResult.type === 'flame_surge') {
      const emitter = this.add.particles(this.localPlayer.x, this.localPlayer.y, 'particle_fire', {
        speed: 160,
        scale: { start: 1, end: 0 },
        lifespan: 400,
        quantity: 12
      });
      this.time.delayedCall(450, () => emitter.destroy());
    } else if (skillResult.type === 'frost_dash') {
      const emitter = this.add.particles(this.localPlayer.x, this.localPlayer.y, 'particle_ice', {
        speed: 100,
        scale: { start: 0.9, end: 0 },
        lifespan: 500,
        quantity: 15
      });
      this.time.delayedCall(550, () => emitter.destroy());
    } else if (skillResult.type === 'singularity_vortex') {
      const emitter = this.add.particles(skillResult.x, skillResult.y, 'particle_void', {
        speed: { min: 20, max: 100 },
        scale: { start: 1.4, end: 0.2 },
        lifespan: 600,
        quantity: 20
      });
      this.time.delayedCall(700, () => emitter.destroy());
    } else if (skillResult.type === 'blade_whirlwind') {
      const emitter = this.add.particles(this.localPlayer.x, this.localPlayer.y, 'particle_sword', {
        speed: 220,
        scale: { start: 1.2, end: 0 },
        lifespan: 350,
        quantity: 16
      });
      this.time.delayedCall(400, () => emitter.destroy());
    }

    // Check hit against dummy or remote players
    if (this.testDummy && !this.testDummy.isDead) {
      const dist = Phaser.Math.Distance.Between(this.localPlayer.x, this.localPlayer.y, this.testDummy.x, this.testDummy.y);
      if (dist < 140) {
        this.testDummy.takeDamage(skillResult.damage, this.localPlayer.x, skillResult.knockback);
      }
    }
  }

  tickMapTimer() {
    this.mapTimerRemainingSec--;

    if (this.mapTimerRemainingSec <= 0) {
      this.rotateMap();
    }

    // Broadcast HUD updates to React
    if (this.localPlayer) {
      this.onHudUpdate({
        hp: Math.round(this.localPlayer.hp),
        maxHp: this.localPlayer.maxHp,
        character: this.localPlayer.archetype,
        power: this.localPlayer.power,
        skillCooldownRemaining: this.localPlayer.skillCooldownRemaining,
        mapTimerRemainingSec: this.mapTimerRemainingSec,
        mapName: this.activeMapConfig.name,
        kills: this.scores.kills,
        deaths: this.scores.deaths
      });
    }
  }

  rotateMap() {
    this.activeMapIndex = (this.activeMapIndex + 1) % MAP_ROTATION_ORDER.length;
    this.activeMapConfig = MAPS_CONFIG[MAP_ROTATION_ORDER[this.activeMapIndex]];
    this.mapTimerRemainingSec = GAME_SETTINGS.COMBAT.MAP_ROTATION_SEC;

    // Animated Loading Screen Flash
    const flash = this.add.rectangle(640, 360, 1280, 720, 0x000000, 1).setDepth(100);
    const text = this.add.text(640, 360, `TRANSITIONING TO: ${this.activeMapConfig.name.toUpperCase()}`, {
      font: 'bold 22px monospace',
      fill: '#00d2d3'
    }).setOrigin(0.5, 0.5).setDepth(101);

    this.time.delayedCall(1200, () => {
      this.buildMap(this.activeMapConfig);

      // Respawn local player on fresh random platform with new character
      const sp = this.getRandomSpawnPoint();
      const newChar = this.getRandomCharacter();
      this.localPlayer.respawn(sp.x, sp.y, newChar);

      if (this.testDummy) {
        const dummySp = this.getRandomSpawnPoint();
        this.testDummy.respawn(dummySp.x, dummySp.y, this.getRandomCharacter());
      }

      this.tweens.add({
        targets: [flash, text],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          flash.destroy();
          text.destroy();
        }
      });
    });
  }

  setupSocketEvents() {
    this.socket.on('arena_snapshot', (players) => {
      players.forEach((pData) => {
        if (pData.id === this.socket.id) return;

        let remote = this.remotePlayers.get(pData.id);
        if (!remote) {
          remote = new Player(this, pData.x, pData.y, {
            id: pData.id,
            username: pData.username,
            isLocal: false,
            colorIndex: pData.colorIndex || 1,
            archetypeId: pData.archetypeId
          });
          this.physics.add.collider(remote, this.solidsGroup);
          this.physics.add.collider(remote, this.platformsGroup);
          this.remotePlayers.set(pData.id, remote);
        }

        remote.targetX = pData.x;
        remote.targetY = pData.y;
        remote.targetVx = pData.vx;
        remote.targetVy = pData.vy;
        remote.hp = pData.hp;
        remote.facing = pData.facing;
        remote.updateHpBar();
      });
    });

    this.socket.on('player_left', ({ id }) => {
      const remote = this.remotePlayers.get(id);
      if (remote) {
        remote.destroy();
        this.remotePlayers.delete(id);
      }
    });
  }

  update(time, delta) {
    if (!this.localPlayer) return;

    this.localPlayer.update(time, delta);
    if (this.testDummy) this.testDummy.update(time, delta);
    this.remotePlayers.forEach((remote) => remote.update(time, delta));

    if (this.localPlayer.isDead) {
      if (this.localPlayer.respawnTimerRemaining <= 0) {
        const sp = this.getRandomSpawnPoint();
        const newChar = this.getRandomCharacter();
        this.localPlayer.respawn(sp.x, sp.y, newChar);
        this.scores.deaths++;
      }
      return;
    }

    // Local Player Movement Controls
    const speed = GAME_SETTINGS.PHYSICS.BASE_SPEED * this.localPlayer.archetype.speedMultiplier;

    // Horizontal Movement
    if (this.keys.A.isDown || this.cursors.left.isDown) {
      this.localPlayer.body.setVelocityX(-speed);
      this.localPlayer.facing = 'left';
      this.localPlayer.drawBody('run');
    } else if (this.keys.D.isDown || this.cursors.right.isDown) {
      this.localPlayer.body.setVelocityX(speed);
      this.localPlayer.facing = 'right';
      this.localPlayer.drawBody('run');
    } else {
      this.localPlayer.drawBody('idle');
    }

    // Platform Drop-Down (Down + Space or S + Space)
    const isDownPressed = this.keys.S.isDown || this.cursors.down.isDown;
    const isJumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
                          Phaser.Input.Keyboard.JustDown(this.keys.W) ||
                          Phaser.Input.Keyboard.JustDown(this.cursors.up);

    if (isDownPressed && isJumpPressed) {
      this.localPlayer.isDroppingDown = true;
      this.localPlayer.dropDownTimer = 250; // 250ms dropdown window
    } else if (isJumpPressed) {
      // Normal / Double Jump
      if (this.localPlayer.jumpCount < this.localPlayer.maxJumps) {
        const isDouble = this.localPlayer.jumpCount > 0;
        const vel = isDouble
          ? GAME_SETTINGS.PHYSICS.DOUBLE_JUMP_VELOCITY
          : GAME_SETTINGS.PHYSICS.JUMP_VELOCITY;

        this.localPlayer.body.setVelocityY(vel);
        this.localPlayer.jumpCount++;
        soundSynth.playJump(isDouble);
        this.localPlayer.drawBody('jump');
      }
    }

    // Attack Key (J)
    if (Phaser.Input.Keyboard.JustDown(this.keys.J)) {
      this.triggerLocalAttack();
    }

    // Skill Key (K or E)
    if (Phaser.Input.Keyboard.JustDown(this.keys.K) || Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.triggerLocalSkill();
    }

    // Network Sync (20 Hz)
    if (this.socket && time - this.lastNetworkEmit > GAME_SETTINGS.NETWORK.INPUT_EMIT_RATE_MS) {
      this.lastNetworkEmit = time;
      this.socket.emit('player_state', {
        x: Math.round(this.localPlayer.x),
        y: Math.round(this.localPlayer.y),
        vx: Math.round(this.localPlayer.body.velocity.x),
        vy: Math.round(this.localPlayer.body.velocity.y),
        facing: this.localPlayer.facing,
        hp: Math.round(this.localPlayer.hp),
        archetypeId: this.localPlayer.archetypeId
      });
    }
  }
}
