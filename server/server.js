import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// STIKI WAR — Authoritative Active Fighters Store (socketId -> fighterState)
const arenaPlayers = new Map();

// 20 Hz Authoritative State Broadcast (50ms interval)
setInterval(() => {
  if (arenaPlayers.size > 0) {
    const snapshot = Array.from(arenaPlayers.values());
    io.emit('arena_snapshot', snapshot);
  }
}, 50);

// Socket.io Real-time Multiplayer Connection Logic
io.on('connection', (socket) => {
  console.log(`[StikiWar Fighter Connected] ID: ${socket.id}`);

  // Receive local player state updates from client
  socket.on('player_state', (stateData) => {
    const existing = arenaPlayers.get(socket.id) || {};
    arenaPlayers.set(socket.id, {
      ...existing,
      id: socket.id,
      ...stateData,
      lastTick: Date.now()
    });
  });

  // Broadcast basic attacks to other clients
  socket.on('player_attack', (attackData) => {
    socket.broadcast.emit('player_attack', { id: socket.id, ...attackData });
  });

  // Broadcast special skill triggers
  socket.on('player_skill', (skillData) => {
    socket.broadcast.emit('player_skill', { id: socket.id, ...skillData });
  });

  // Authoritative hit and damage arbitration
  socket.on('player_hit', ({ targetId, damage, attackerX }) => {
    const target = arenaPlayers.get(targetId);
    if (target) {
      target.hp = Math.max(0, (target.hp || 100) - damage);
      io.emit('player_damaged', {
        targetId,
        damage,
        attackerX,
        currentHp: target.hp
      });
    }
  });

  // Handle Disconnection (Immediate removal per locked specs)
  socket.on('disconnect', () => {
    console.log(`[StikiWar Fighter Left] ID: ${socket.id}`);
    if (arenaPlayers.has(socket.id)) {
      arenaPlayers.delete(socket.id);
      io.emit('player_left', { id: socket.id });
    }
  });
});

// Health check API endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    game: 'STIKI WAR Arena',
    activeFighters: arenaPlayers.size,
    tickRateHz: 20,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[STIKI WAR Server] 20 Hz Authoritative Engine running on http://localhost:${PORT}`);
});
