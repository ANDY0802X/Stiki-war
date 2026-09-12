// STIKI WAR — High-Accuracy Map Configurations & Platform Geometry
// Carefully mapped to 1280x720 single-screen arena bounds

export const MAPS_CONFIG = {
  map_01: {
    id: 'map_01',
    name: 'Waterfall Gorge & Lava Cavern',
    subtext: 'Safe Riverbanks & Scorching Magma',
    assetPath: '/assets/maps/map_01.png',
    bgKey: 'map_bg_01',
    themeColor: '#e17055',
    bounds: { width: 1280, height: 720 },
    // Solid boundary colliders (arena border walls and foundational rock bases)
    solids: [
      { x: 10, y: 360, width: 20, height: 720 },    // Left arena wall
      { x: 1270, y: 360, width: 20, height: 720 },  // Right arena wall
      { x: 640, y: 10, width: 1280, height: 20 },   // Ceiling
      { x: 130, y: 700, width: 260, height: 40 },   // Left bank solid base
      { x: 640, y: 710, width: 320, height: 20 }    // Center riverbed stones
    ],
    // Semi-solid jump-through platforms (jump up through, drop down with Down+Jump)
    platforms: [
      // Left cliff wooden deck
      { x: 140, y: 500, width: 220, height: 16 },
      // Left high dojo balcony & wooden bridge
      { x: 230, y: 245, width: 260, height: 16 },
      // Center floating island with tree
      { x: 515, y: 255, width: 160, height: 16 },
      // Center suspended cable platform
      { x: 500, y: 440, width: 200, height: 16 },
      // Center lower waterfall stepping platforms
      { x: 380, y: 585, width: 160, height: 16 },
      { x: 630, y: 585, width: 160, height: 16 },
      // Right arch & mid-tier ledge with crate
      { x: 690, y: 440, width: 160, height: 16 },
      { x: 990, y: 440, width: 280, height: 16 },
      // Right upper watchtower terrace ("Stay Aggressive")
      { x: 1060, y: 245, width: 280, height: 16 }
    ],
    // Hazardous zones
    hazards: [
      {
        type: 'lava',
        name: 'Lava Cavern Pit',
        x: 1060,
        y: 700,
        width: 380,
        height: 40,
        instantDamage: 50,
        burnDamagePerSec: 20,
        color: 0xff3838
      }
    ],
    // Spawn positions across tiers
    spawns: [
      { x: 140, y: 440 },
      { x: 230, y: 190 },
      { x: 500, y: 380 },
      { x: 515, y: 190 },
      { x: 990, y: 380 },
      { x: 1060, y: 180 }
    ]
  },

  map_02: {
    id: 'map_02',
    name: 'Torii Shrine & Spike Beds',
    subtext: 'Small Map Big Chaos',
    assetPath: '/assets/maps/map_02.png',
    bgKey: 'map_bg_02',
    themeColor: '#d63031',
    bounds: { width: 1280, height: 720 },
    solids: [
      { x: 10, y: 360, width: 20, height: 720 },    // Left arena wall
      { x: 1270, y: 360, width: 20, height: 720 },  // Right arena wall
      { x: 640, y: 10, width: 1280, height: 20 },   // Ceiling
      { x: 640, y: 690, width: 380, height: 60 }    // Center stone bridge arches
    ],
    platforms: [
      // Left mid stone terrace
      { x: 130, y: 500, width: 240, height: 16 },
      // Left high cliff with cherry blossom & banner
      { x: 130, y: 270, width: 240, height: 16 },
      // Left suspended rope bridge & hanging lantern rock
      { x: 360, y: 345, width: 160, height: 16 },
      // Center floating stone under Torii Gate ("Small Map Big Chaos")
      { x: 640, y: 375, width: 180, height: 16 },
      // Center main stone bridge top
      { x: 640, y: 535, width: 380, height: 16 },
      // Right suspended rope bridge & hanging lantern rock
      { x: 920, y: 345, width: 160, height: 16 },
      // Right mid stone terrace
      { x: 1150, y: 500, width: 240, height: 16 },
      // Right high cliff with banner ("Stick Fight Repeat")
      { x: 1150, y: 270, width: 240, height: 16 }
    ],
    hazards: [
      {
        type: 'spike',
        name: 'Left Flanking Red Spikes',
        x: 270,
        y: 635,
        width: 170,
        height: 30,
        instantDamage: 35,
        bounceImpulseY: -420,
        color: 0xd63031
      },
      {
        type: 'spike',
        name: 'Right Flanking Red Spikes',
        x: 1010,
        y: 635,
        width: 170,
        height: 30,
        instantDamage: 35,
        bounceImpulseY: -420,
        color: 0xd63031
      }
    ],
    spawns: [
      { x: 130, y: 210 },
      { x: 130, y: 440 },
      { x: 360, y: 280 },
      { x: 640, y: 310 },
      { x: 640, y: 470 },
      { x: 920, y: 280 },
      { x: 1150, y: 210 },
      { x: 1150, y: 440 }
    ]
  },

  map_03: {
    id: 'map_03',
    name: 'Sky Islands & Castle Watchtower',
    subtext: 'Skills Make Comebacks',
    assetPath: '/assets/maps/map03.png',
    bgKey: 'map_bg_03',
    themeColor: '#0984e3',
    bounds: { width: 1280, height: 720 },
    solids: [
      { x: 10, y: 360, width: 20, height: 720 },    // Left arena wall
      { x: 1270, y: 360, width: 20, height: 720 },  // Right arena wall
      { x: 640, y: 10, width: 1280, height: 20 },   // Ceiling
      { x: 640, y: 700, width: 1280, height: 40 }   // Safe bottom water line
    ],
    platforms: [
      // Left wooden dock & pier on lake
      { x: 150, y: 585, width: 260, height: 16 },
      // Left floating rock platform
      { x: 310, y: 450, width: 160, height: 16 },
      // Left high sky shack with banner ("Skills Make Comebacks")
      { x: 150, y: 215, width: 240, height: 16 },
      // Left rope bridge to hanging sky island
      { x: 420, y: 245, width: 180, height: 16 },
      // Central massive floating island with stone arch and ladder
      { x: 640, y: 435, width: 340, height: 16 },
      // Stepping stone island below central ladder
      { x: 500, y: 640, width: 160, height: 16 },
      // Right floating rock platform
      { x: 910, y: 480, width: 160, height: 16 },
      // Right upper floating island
      { x: 940, y: 250, width: 180, height: 16 },
      // Right castle watchtower lower deck
      { x: 1140, y: 585, width: 240, height: 16 },
      // Right castle watchtower middle terrace ("Different Plays Same Stories")
      { x: 1120, y: 345, width: 240, height: 16 }
    ],
    hazards: [], // Water is safe (0 damage)
    spawns: [
      { x: 150, y: 150 },
      { x: 150, y: 520 },
      { x: 420, y: 180 },
      { x: 640, y: 370 },
      { x: 500, y: 580 },
      { x: 940, y: 190 },
      { x: 1120, y: 280 }
    ]
  }
};

export const MAP_ROTATION_ORDER = ['map_01', 'map_02', 'map_03'];
