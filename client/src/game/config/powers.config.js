// STIKI WAR — Special Powers & Ability Configurations (All 7.0s Cooldown)

export const POWERS_CONFIG = {
  flame_surge: {
    id: 'flame_surge',
    name: 'Flame Surge',
    characterId: 'flame_puncher',
    icon: '🔥',
    cooldownSec: 7.0,
    damage: 35,
    knockback: 450,
    lungeSpeed: 600,
    lungeDurationMs: 200,
    description: 'Lunging explosive fire punch with high knockback and burn spark burst.'
  },

  frost_dash: {
    id: 'frost_dash',
    name: 'Frost Dash',
    characterId: 'ice_speedster',
    icon: '❄️',
    cooldownSec: 7.0,
    damage: 25,
    dashSpeed: 750,
    dashDurationMs: 220,
    slowDurationSec: 1.5,
    description: 'High-speed freezing dash leaving an icy trail that slows caught enemies.'
  },

  singularity_vortex: {
    id: 'singularity_vortex',
    name: 'Singularity Vortex',
    characterId: 'void_thrower',
    icon: '🔮',
    cooldownSec: 7.0,
    damage: 35,
    vortexRadius: 130,
    pullForce: 300,
    implosionDelayMs: 650,
    description: 'Spawns a gravitational rift that pulls nearby enemies and implodes.'
  },

  blade_whirlwind: {
    id: 'blade_whirlwind',
    name: 'Blade Whirlwind',
    characterId: 'sword_fighter',
    icon: '⚔️',
    cooldownSec: 7.0,
    damage: 40,
    radius: 110,
    spinDurationMs: 300,
    description: 'Sweeping 360-degree golden blade cyclone striking all adjacent opponents.'
  }
};
