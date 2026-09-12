// STIKI WAR — Core Game Settings Configuration

export const GAME_SETTINGS = {
  // Viewport & Canvas
  WIDTH: 1280,
  HEIGHT: 720,
  ASPECT_RATIO: 16 / 9,

  // Physics (Phaser Arcade Physics) - Tuned for grounded, punchy platforming
  PHYSICS: {
    GRAVITY_Y: 1200,
    BASE_SPEED: 300,
    ICE_SPEED_MULTIPLIER: 1.25, // Ice Speedster passive
    JUMP_VELOCITY: -530,
    DOUBLE_JUMP_VELOCITY: -470,
    GROUND_DRAG: 2200,
    AIR_DRAG: 300,
    MAX_FALL_SPEED: 850,
    GHOSTING: true // Players pass through each other
  },

  // Combat & Health
  COMBAT: {
    BASE_HP: 100,
    PASSIVE_REGEN_RATE: 2, // +2 HP per second
    REGEN_RAMP_RATE: 10,   // +10 HP per second when safe
    REGEN_RAMP_DELAY_MS: 2000, // 2s without damage to trigger ramp
    BASIC_ATTACK_DAMAGE: 15,
    BASIC_ATTACK_COOLDOWN_MS: 220, // Rapid mashing cadence
    SKILL_COOLDOWN_SEC: 7.0, // 7.0s special cooldown
    RESPAWN_DELAY_SEC: 10.0,
    SPAWN_INVINCIBILITY_SEC: 1.5,
    MAP_ROTATION_SEC: 300 // 5 minutes (300 seconds)
  },

  // Multiplayer Network
  NETWORK: {
    SERVER_TICK_RATE_HZ: 20,
    CLIENT_LERP_FACTOR: 0.25,
    INPUT_EMIT_RATE_MS: 40
  },

  // Player Glowing Outlines for 6-player clarity
  PLAYER_COLORS: [
    { name: 'Red', hex: '#ff3838', phaserHex: 0xff3838 },
    { name: 'Cyan', hex: '#00d2d3', phaserHex: 0x00d2d3 },
    { name: 'Green', hex: '#2ed573', phaserHex: 0x2ed573 },
    { name: 'Yellow', hex: '#ffa502', phaserHex: 0xffa502 },
    { name: 'Purple', hex: '#9b59b6', phaserHex: 0x9b59b6 },
    { name: 'White', hex: '#f1f2f6', phaserHex: 0xf1f2f6 }
  ]
};
