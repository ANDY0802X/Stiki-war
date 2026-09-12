import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import StikiWarGame from './game/components/StikiWarGame.jsx';
import { GAME_SETTINGS } from './game/config/gameSettings.js';

// Arcade / Brawler Nickname Generator
const BRAWLER_PREFIXES = [
  'Blaze', 'Frost', 'Vortex', 'Shadow', 'Iron', 'Thunder', 'Ghost', 'Nova',
  'Cyber', 'Fatal', 'Venom', 'Strike', 'Apex', 'Phantom', 'Inferno', 'Echo'
];

const BRAWLER_TITLES = [
  'Striker', 'Brawler', 'Fighter', 'Ninja', 'Slayer', 'Gladiator', 'Smasher',
  'Champion', 'Warrior', 'Reaper', 'Knight', 'Assassin', 'Warlock', 'Pummeled'
];

const getRandomName = () => {
  const p = BRAWLER_PREFIXES[Math.floor(Math.random() * BRAWLER_PREFIXES.length)];
  const t = BRAWLER_TITLES[Math.floor(Math.random() * BRAWLER_TITLES.length)];
  return `${p}_${t}`;
};

export default function App() {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('stikiwar_username') || getRandomName();
  });

  const [userColor, setUserColor] = useState(() => {
    return localStorage.getItem('stikiwar_usercolor') || GAME_SETTINGS.PLAYER_COLORS[0].hex;
  });

  const [inGameArena, setInGameArena] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('stikiwar_username', username);
    localStorage.setItem('stikiwar_usercolor', userColor);

    const socketUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : window.location.origin;

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[StikiWar Socket Connected]', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[StikiWar Socket Disconnected]');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [username, userColor]);

  const handleRerollUsername = () => {
    const newName = getRandomName();
    setUsername(newName);
    localStorage.setItem('stikiwar_username', newName);
  };

  const handleSelectColor = (hex) => {
    setUserColor(hex);
    localStorage.setItem('stikiwar_usercolor', hex);
  };

  // If inside the game arena, render full Phaser + React HUD component
  if (inGameArena) {
    return (
      <div className="app-root">
        <StikiWarGame
          socket={socketRef.current}
          username={username}
          userColor={userColor}
          onLeave={() => setInGameArena(false)}
        />
      </div>
    );
  }

  return (
    <div className="app-root stiki-hub-page">
      {/* Top Header */}
      <header className="stiki-header">
        <div className="stiki-brand">
          <span className="brand-badge">⚔️</span>
          <div>
            <h1 className="brand-name">STIKI WAR</h1>
            <p className="brand-tagline">2D Multiplayer Stickman Arena Brawler</p>
          </div>
        </div>

        <div className="network-indicator">
          <span
            className="status-dot"
            style={{ backgroundColor: isConnected ? '#2ed573' : '#ff4757' }}
          />
          <span>{isConnected ? 'Socket 20 Hz Live' : 'Connecting to Server...'}</span>
        </div>
      </header>

      {/* Main Hub Body */}
      <main className="stiki-main-container">
        {/* Hero Section & Launch Control */}
        <section className="stiki-hero-card">
          <div className="hero-badge">⚡ INSTANT DROP-IN ARENA</div>
          <h2 className="hero-heading">Infinite Brawl. 4 Classes. Zero Mercy.</h2>
          <p className="hero-subtext">
            Fast-paced single-screen platformer combat with up to 6 simultaneous fighters,
            snappy double jumps, rapid attack mashing, and 7.0-second special abilities.
          </p>

          {/* Profile & Customization Box */}
          <div className="profile-config-card">
            <div className="config-row">
              <label className="config-label">Fighter Handle:</label>
              <div className="handle-input-group">
                <input
                  type="text"
                  className="handle-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 20))}
                  placeholder="Enter fighter alias"
                  maxLength={20}
                />
                <button
                  className="btn-reroll"
                  onClick={handleRerollUsername}
                  title="Roll random alias"
                >
                  🎲 Roll
                </button>
              </div>
            </div>

            <div className="config-row">
              <label className="config-label">Glow Outline Aura:</label>
              <div className="color-palette">
                {GAME_SETTINGS.PLAYER_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    className={`color-chip ${userColor === col.hex ? 'active' : ''}`}
                    style={{
                      backgroundColor: col.hex,
                      boxShadow: userColor === col.hex ? `0 0 12px ${col.hex}` : 'none'
                    }}
                    onClick={() => handleSelectColor(col.hex)}
                    title={col.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Launch Action */}
          <div className="hero-cta-group">
            <button
              className="btn-enter-arena"
              onClick={() => setInGameArena(true)}
            >
              <span>⚔️ ENTER BATTLE ARENA</span>
            </button>
          </div>
        </section>

        {/* Character Roster Showcase */}
        <section className="stiki-roster-section">
          <h3 className="section-title">THE 4 BRAWLER ARCHETYPES</h3>
          <p className="section-sub">Assigned randomly on match join and re-rolled on every respawn!</p>

          <div className="roster-grid">
            <div className="fighter-card flame">
              <div className="fighter-card-header">
                <img
                  src="/assets/characters/portraits/flame_puncher_portrait.png"
                  alt="Flame Puncher"
                  className="fighter-portrait"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <h4 className="fighter-name">Flame Puncher</h4>
                  <span className="fighter-motto">"Burn Through Limits"</span>
                </div>
              </div>
              <p className="fighter-desc">Blazing fire fists and high burst impact with explosive lunging punches.</p>
              <div className="fighter-skill-tag">🔥 Skill: Flame Surge</div>
            </div>

            <div className="fighter-card ice">
              <div className="fighter-card-header">
                <img
                  src="/assets/characters/portraits/ice_speedster_portrait.png"
                  alt="Ice Speedster"
                  className="fighter-portrait"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <h4 className="fighter-name">Ice Speedster</h4>
                  <span className="fighter-motto">"Faster Than Thought"</span>
                </div>
              </div>
              <p className="fighter-desc">+25% sprint mobility with the only true high-speed freezing dash in the arena.</p>
              <div className="fighter-skill-tag">❄️ Skill: Frost Dash</div>
            </div>

            <div className="fighter-card void">
              <div className="fighter-card-header">
                <img
                  src="/assets/characters/portraits/void_thrower_portrait.png"
                  alt="Void Thrower"
                  className="fighter-portrait"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <h4 className="fighter-name">Void Thrower</h4>
                  <span className="fighter-motto">"Gravity Is A Suggestion"</span>
                </div>
              </div>
              <p className="fighter-desc">Cosmic dark matter orbs with floaty jumps and gravity vortex implosions.</p>
              <div className="fighter-skill-tag">🔮 Skill: Singularity Vortex</div>
            </div>

            <div className="fighter-card sword">
              <div className="fighter-card-header">
                <img
                  src="/assets/characters/portraits/sword_fighter_portrait.png"
                  alt="Sword Fighter"
                  className="fighter-portrait"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <h4 className="fighter-name">Sword Fighter</h4>
                  <span className="fighter-motto">"Precision Wins Wars"</span>
                </div>
              </div>
              <p className="fighter-desc">Disciplined golden katana strikes with extended hitboxes and 360° slashes.</p>
              <div className="fighter-skill-tag">⚔️ Skill: Blade Whirlwind</div>
            </div>
          </div>
        </section>

        {/* Combat Controls Guide */}
        <section className="stiki-controls-card">
          <h3 className="section-title">COMBAT KEYBINDINGS & MECHANICS</h3>
          <div className="controls-grid">
            <div className="control-item">
              <span className="key-badge">A / D or ← / →</span>
              <span className="key-desc">Horizontal Run</span>
            </div>
            <div className="control-item">
              <span className="key-badge">Space or W</span>
              <span className="key-desc">Double Jump (Ground + Air)</span>
            </div>
            <div className="control-item">
              <span className="key-badge">S + Space</span>
              <span className="key-desc">Drop Down Semi-Solid Ledge</span>
            </div>
            <div className="control-item">
              <span className="key-badge">J or Left Click</span>
              <span className="key-desc">Rapid Attack Mashing</span>
            </div>
            <div className="control-item">
              <span className="key-badge">K or E or Right Click</span>
              <span className="key-desc">Special Power (7.0s Cooldown)</span>
            </div>
            <div className="control-item">
              <span className="key-badge">Touchpad / Mobile</span>
              <span className="key-desc">Virtual D-Pad & Action Buttons</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="stiki-footer">
        <span>STIKI WAR v1.0 • Built with React 18 & Phaser 3 • Socket.io 20 Hz Authoritative Engine</span>
      </footer>
    </div>
  );
}
