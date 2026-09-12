// STIKI WAR — Character Archetype Configurations

export const CHARACTERS_CONFIG = {
  flame_puncher: {
    id: 'flame_puncher',
    name: 'Flame Puncher',
    title: 'Burn Through Limits',
    description: 'Blazing fists of fire delivering relentless close-range knockouts.',
    primaryColor: '#e84118',
    secondaryColor: '#f0932b',
    phaserColor: 0xe84118,
    speedMultiplier: 1.0,
    gravityMultiplier: 1.0,
    attackDamage: 18,
    attackRange: 60,
    specialSkillId: 'flame_surge',
    passiveDescription: 'Leaves a burning spark trail; higher burst impact.'
  },

  ice_speedster: {
    id: 'ice_speedster',
    name: 'Ice Speedster',
    title: 'Faster Than Thought',
    description: 'Ultra-agile frost fighter with the only true high-speed dash.',
    primaryColor: '#00d2d3',
    secondaryColor: '#54a0ff',
    phaserColor: 0x00d2d3,
    speedMultiplier: 1.25, // 25% faster
    gravityMultiplier: 1.0,
    attackDamage: 14,
    attackRange: 55,
    specialSkillId: 'frost_dash',
    passiveDescription: '+25% baseline sprint speed; Frost Dash grants unique dash mobility.'
  },

  void_thrower: {
    id: 'void_thrower',
    name: 'Void Thrower',
    title: 'Gravity Is A Suggestion',
    description: 'Dark-matter conjurer firing cosmic orbs and singularity rifts.',
    primaryColor: '#8854d0',
    secondaryColor: '#3c40c6',
    phaserColor: 0x8854d0,
    speedMultiplier: 0.95,
    gravityMultiplier: 0.85, // Floaty drift
    attackDamage: 16,
    attackRange: 180, // Ranged dark projectile
    specialSkillId: 'singularity_vortex',
    passiveDescription: 'Cosmic low-gravity double jump and projectile basic attacks.'
  },

  sword_fighter: {
    id: 'sword_fighter',
    name: 'Sword Fighter',
    title: 'Precision Wins Wars',
    description: 'Disciplined blade master with wide crescent slashes and 360 sweeps.',
    primaryColor: '#f1c40f',
    secondaryColor: '#e67e22',
    phaserColor: 0xf1c40f,
    speedMultiplier: 1.05,
    gravityMultiplier: 1.0,
    attackDamage: 20,
    attackRange: 85, // Extended melee reach
    specialSkillId: 'blade_whirlwind',
    passiveDescription: 'Extended melee hitboxes and sweeping crescent arc damage.'
  }
};

export const CHARACTER_KEYS = Object.keys(CHARACTERS_CONFIG);
