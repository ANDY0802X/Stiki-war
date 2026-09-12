import Phaser from 'phaser';

const CHARACTERS = ['flame_puncher', 'ice_speedster', 'void_thrower', 'sword_fighter'];
const ANIMATIONS = ['idle', 'run', 'jump', 'attack', 'hit', 'skill', 'death', 'victory'];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Show loading progress bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x11111e, 0.85);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: '⚔️ LOADING STIKI WAR ARENA...',
      style: {
        font: 'bold 16px sans-serif',
        fill: '#00d2d3'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x00d2d3, 1);
      progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 6);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // 1. Load 3 Static Map Backgrounds
    this.load.image('map_bg_01', '/assets/maps/map_01.png');
    this.load.image('map_bg_02', '/assets/maps/map_02.png');
    this.load.image('map_bg_03', '/assets/maps/map03.png');

    // 2. Load 32 Sprite Frames (4 fighters x 8 animations)
    for (const charId of CHARACTERS) {
      for (const anim of ANIMATIONS) {
        this.load.image(`${charId}_${anim}`, `/assets/characters/sprites/${charId}_${anim}.png`);
      }
      // Load Portrait Card
      this.load.image(`${charId}_portrait`, `/assets/characters/portraits/${charId}_portrait.png`);
    }
  }

  create() {
    // 1. Generate procedural particle and VFX textures
    this.createProceduralTextures();

    // 2. Register Phaser Animations for all 4 fighters
    this.registerCharacterAnimations();

    // 3. Transition into the active Arena Scene
    this.scene.start('ArenaScene');
  }

  registerCharacterAnimations() {
    for (const charId of CHARACTERS) {
      // Idle Animation
      if (!this.anims.exists(`${charId}_idle`)) {
        this.anims.create({
          key: `${charId}_idle`,
          frames: [{ key: `${charId}_idle` }],
          frameRate: 1
        });
      }

      // Run Animation (cycling run and idle frames)
      if (!this.anims.exists(`${charId}_run`)) {
        this.anims.create({
          key: `${charId}_run`,
          frames: [
            { key: `${charId}_run` },
            { key: `${charId}_idle` }
          ],
          frameRate: 6,
          repeat: -1
        });
      }

      // Jump Animation
      if (!this.anims.exists(`${charId}_jump`)) {
        this.anims.create({
          key: `${charId}_jump`,
          frames: [{ key: `${charId}_jump` }],
          frameRate: 1
        });
      }

      // Attack Animation
      if (!this.anims.exists(`${charId}_attack`)) {
        this.anims.create({
          key: `${charId}_attack`,
          frames: [
            { key: `${charId}_attack` },
            { key: `${charId}_idle` }
          ],
          frameRate: 8,
          repeat: 0
        });
      }

      // Hit Reaction
      if (!this.anims.exists(`${charId}_hit`)) {
        this.anims.create({
          key: `${charId}_hit`,
          frames: [{ key: `${charId}_hit` }],
          frameRate: 1
        });
      }

      // Special Skill
      if (!this.anims.exists(`${charId}_skill`)) {
        this.anims.create({
          key: `${charId}_skill`,
          frames: [
            { key: `${charId}_skill` },
            { key: `${charId}_attack` },
            { key: `${charId}_idle` }
          ],
          frameRate: 6,
          repeat: 0
        });
      }

      // Death
      if (!this.anims.exists(`${charId}_death`)) {
        this.anims.create({
          key: `${charId}_death`,
          frames: [{ key: `${charId}_death` }],
          frameRate: 1
        });
      }

      // Victory
      if (!this.anims.exists(`${charId}_victory`)) {
        this.anims.create({
          key: `${charId}_victory`,
          frames: [{ key: `${charId}_victory` }],
          frameRate: 1
        });
      }
    }
  }

  createProceduralTextures() {
    // Fire particle
    if (!this.textures.exists('particle_fire')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xff4757, 1);
      g.fillCircle(8, 8, 8);
      g.fillStyle(0xffa502, 1);
      g.fillCircle(8, 8, 4);
      g.generateTexture('particle_fire', 16, 16);
      g.destroy();
    }

    // Ice particle
    if (!this.textures.exists('particle_ice')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x70a1ff, 1);
      g.fillRect(2, 2, 10, 10);
      g.fillStyle(0xffffff, 1);
      g.fillRect(4, 4, 6, 6);
      g.generateTexture('particle_ice', 14, 14);
      g.destroy();
    }

    // Void dark matter particle
    if (!this.textures.exists('particle_void')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8854d0, 0.85);
      g.fillCircle(10, 10, 10);
      g.fillStyle(0x2f3542, 1);
      g.fillCircle(10, 10, 5);
      g.generateTexture('particle_void', 20, 20);
      g.destroy();
    }

    // Sword slash arc particle
    if (!this.textures.exists('particle_sword')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xf1c40f, 1);
      g.fillTriangle(0, 0, 20, 8, 0, 16);
      g.generateTexture('particle_sword', 20, 16);
      g.destroy();
    }

    // Shield bubble for respawn invulnerability
    if (!this.textures.exists('shield_bubble')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.lineStyle(3, 0x00d2d3, 0.9);
      g.strokeCircle(28, 28, 26);
      g.fillStyle(0x00d2d3, 0.25);
      g.fillCircle(28, 28, 24);
      g.generateTexture('shield_bubble', 56, 56);
      g.destroy();
    }
  }
}
