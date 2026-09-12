import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

const ARCHETYPES = ['ice_speedster', 'flame_puncher', 'void_thrower', 'sword_fighter'];
const SPAWN_POINTS = [
  { x: 260, y: 390 },
  { x: 820, y: 390 },
  { x: 540, y: 220 },
  { x: 420, y: 550 },
  { x: 860, y: 550 }
];

console.log(`[Test User 2 Bot] Connecting to ${SERVER_URL}...`);

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling']
});

const bot = {
  id: null,
  username: 'Test_User_2',
  colorIndex: 1, // Cyan outline
  archetypeId: 'ice_speedster',
  x: 820,
  y: 390,
  vx: 0,
  vy: 0,
  facing: 'left',
  hp: 100,
  maxHp: 100,
  isDead: false,
  isInvincible: false,
  lastAttackTime: 0,
  lastSkillTime: 0,
  patrolDir: -1,
  minX: 620,
  maxX: 980,
  targetPlayer: null
};

socket.on('connect', () => {
  bot.id = socket.id;
  console.log(`[Test User 2] Connected to arena! Socket ID: ${bot.id}`);
});

socket.on('arena_snapshot', (players) => {
  const otherPlayer = players.find(p => p.id !== socket.id && p.hp > 0);
  bot.targetPlayer = otherPlayer || null;
});

socket.on('player_damaged', ({ targetId, damage, attackerX, currentHp }) => {
  if (targetId === socket.id) {
    bot.hp = currentHp !== undefined ? currentHp : Math.max(0, bot.hp - damage);
    console.log(`[Test User 2] Took ${damage} damage! Remaining HP: ${bot.hp}`);

    const knockDir = bot.x >= attackerX ? 1 : -1;
    bot.vx = knockDir * 280;
    bot.x += knockDir * 20;

    if (bot.hp <= 0 && !bot.isDead) {
      bot.isDead = true;
      bot.vx = 0;
      bot.vy = 0;
      console.log(`[Test User 2] Knocked out! Respawning in 5 seconds...`);

      setTimeout(() => {
        respawnBot();
      }, 5000);
    }
  }
});

function respawnBot() {
  const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
  bot.x = spawn.x;
  bot.y = spawn.y;
  bot.vx = 0;
  bot.vy = 0;
  bot.hp = 100;
  bot.isDead = false;
  bot.archetypeId = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  bot.minX = Math.max(100, spawn.x - 180);
  bot.maxX = Math.min(1180, spawn.x + 180);
  console.log(`[Test User 2] Respawned as ${bot.archetypeId} at (${spawn.x}, ${spawn.y})!`);
}

setInterval(() => {
  if (!socket.connected) return;

  const now = Date.now();

  if (!bot.isDead) {
    if (bot.hp < bot.maxHp) {
      bot.hp = Math.min(bot.maxHp, bot.hp + 0.1);
    }

    if (bot.targetPlayer) {
      const p = bot.targetPlayer;
      const dx = p.x - bot.x;
      const dy = p.y - bot.y;
      const dist = Math.hypot(dx, dy);

      bot.facing = dx >= 0 ? 'right' : 'left';

      if (dist < 85) {
        bot.vx = 0;
        if (now - bot.lastAttackTime > 700) {
          bot.lastAttackTime = now;
          socket.emit('player_attack', { x: bot.x, y: bot.y });
          socket.emit('player_hit', {
            targetId: p.id,
            damage: 12,
            attackerX: bot.x
          });
        }

        if (now - bot.lastSkillTime > 8000) {
          bot.lastSkillTime = now;
          socket.emit('player_skill', {
            type: bot.archetypeId === 'flame_puncher' ? 'flame_surge' :
                  bot.archetypeId === 'ice_speedster' ? 'frost_dash' :
                  bot.archetypeId === 'void_thrower' ? 'singularity_vortex' : 'blade_whirlwind',
            x: bot.x,
            y: bot.y
          });
          socket.emit('player_hit', {
            targetId: p.id,
            damage: 22,
            attackerX: bot.x
          });
        }
      } else if (dist < 400) {
        const speed = 190;
        bot.vx = dx > 0 ? speed : -speed;
        bot.x += bot.vx * 0.05;
      } else {
        runPatrol();
      }
    } else {
      runPatrol();
    }
  }

  socket.emit('player_state', {
    username: bot.username,
    colorIndex: bot.colorIndex,
    x: Math.round(bot.x),
    y: Math.round(bot.y),
    vx: Math.round(bot.vx),
    vy: Math.round(bot.vy),
    facing: bot.facing,
    hp: Math.round(bot.hp),
    archetypeId: bot.archetypeId
  });
}, 50);

function runPatrol() {
  const speed = 140;
  bot.vx = bot.patrolDir * speed;
  bot.x += bot.vx * 0.05;

  if (bot.x <= bot.minX) {
    bot.x = bot.minX;
    bot.patrolDir = 1;
    bot.facing = 'right';
  } else if (bot.x >= bot.maxX) {
    bot.x = bot.maxX;
    bot.patrolDir = -1;
    bot.facing = 'left';
  }
}
