import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import BootScene from '../scenes/BootScene.js';
import ArenaScene from '../scenes/ArenaScene.js';
import { GAME_SETTINGS } from '../config/gameSettings.js';
import { soundSynth } from '../audio/soundSynth.js';
import './StikiWarGame.css';

export default function StikiWarGame({ socket, username, userColor, onLeave }) {
  const gameContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  // HUD State
  const [hudData, setHudData] = useState({
    hp: 100,
    maxHp: 100,
    character: { name: 'Flame Puncher', primaryColor: '#e84118' },
    power: { name: 'Flame Surge', icon: '🔥', cooldownSec: 7.0 },
    skillCooldownRemaining: 0,
    mapTimerRemainingSec: 300,
    mapName: 'Waterfall Gorge & Lava Cavern',
    kills: 0,
    deaths: 0
  });

  // Real-time Laptop Keycap State for interactive on-screen keyboard dock
  const [activeKeys, setActiveKeys] = useState({
    A: false,
    D: false,
    W: false,
    S: false,
    SPACE: false,
    J: false,
    K: false,
    E: false
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const code = e.key?.toUpperCase();
      if (e.code === 'Space') {
        setActiveKeys((prev) => ({ ...prev, SPACE: true }));
      } else if (['A', 'D', 'W', 'S', 'J', 'K', 'E'].includes(code)) {
        setActiveKeys((prev) => ({ ...prev, [code]: true }));
      }
    };

    const handleKeyUp = (e) => {
      const code = e.key?.toUpperCase();
      if (e.code === 'Space') {
        setActiveKeys((prev) => ({ ...prev, SPACE: false }));
      } else if (['A', 'D', 'W', 'S', 'J', 'K', 'E'].includes(code)) {
        setActiveKeys((prev) => ({ ...prev, [code]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundSynth.setMuted(next);
  };

  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Phaser 3 Game Configuration
    const config = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: GAME_SETTINGS.WIDTH,
      height: GAME_SETTINGS.HEIGHT,
      backgroundColor: '#0a0a14',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [BootScene, ArenaScene]
    };

    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;

    // Store state in Phaser global registry for seamless scene access
    game.registry.set('arenaData', {
      socket,
      username,
      userColor,
      onHudUpdate: (data) => setHudData((prev) => ({ ...prev, ...data }))
    });

    // Cleanup on unmount (React 18 friendly)
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [socket, username, userColor]);

  // Format Map Timer (MM:SS)
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Skill Cooldown Ratio
  const skillCdSec = (hudData.skillCooldownRemaining / 1000).toFixed(1);
  const isSkillReady = hudData.skillCooldownRemaining <= 0;

  // Touch Virtual Button Handlers
  const handleTouchAttack = () => {
    const scene = gameInstanceRef.current?.scene.getScene('ArenaScene');
    if (scene) scene.triggerLocalAttack();
  };

  const handleTouchSkill = () => {
    const scene = gameInstanceRef.current?.scene.getScene('ArenaScene');
    if (scene) scene.triggerLocalSkill();
  };

  const handleTouchJump = () => {
    const scene = gameInstanceRef.current?.scene.getScene('ArenaScene');
    if (scene?.localPlayer && !scene.localPlayer.isDead) {
      if (scene.localPlayer.jumpCount < scene.localPlayer.maxJumps) {
        const isDouble = scene.localPlayer.jumpCount > 0;
        const vel = isDouble
          ? GAME_SETTINGS.PHYSICS.DOUBLE_JUMP_VELOCITY
          : GAME_SETTINGS.PHYSICS.JUMP_VELOCITY;
        scene.localPlayer.body.setVelocityY(vel);
        scene.localPlayer.jumpCount++;
        soundSynth.playJump(isDouble);
      }
    }
  };

  const handleTouchDropDown = () => {
    const scene = gameInstanceRef.current?.scene.getScene('ArenaScene');
    if (scene?.localPlayer) {
      scene.localPlayer.isDroppingDown = true;
      scene.localPlayer.dropDownTimer = 300;
    }
  };

  return (
    <div className="stiki-war-wrapper">
      {/* Top HUD Bar */}
      <div className="stiki-hud-bar">
        {/* Left: Player Profile & HP */}
        <div className="stiki-hud-player">
          <div className="stiki-avatar-badge" style={{ borderColor: userColor }}>
            <img
              src={`/assets/characters/portraits/${hudData.character?.id || 'flame_puncher'}_portrait.png`}
              alt={hudData.character?.name || 'Character'}
              className="stiki-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div className="stiki-player-info">
            <div className="stiki-player-name">{username}</div>
            <div className="stiki-hp-container">
              <div
                className="stiki-hp-fill"
                style={{
                  width: `${Math.max(0, hudData.hp)}%`,
                  backgroundColor:
                    hudData.hp > 50 ? '#2ed573' : hudData.hp > 25 ? '#ffa502' : '#ff4757'
                }}
              />
              <span className="stiki-hp-text">{hudData.hp} / 100 HP</span>
            </div>
          </div>
        </div>

        {/* Center: Map Title & 5-Min Countdown */}
        <div className="stiki-hud-map">
          <div className="stiki-map-name">{hudData.mapName}</div>
          <div className="stiki-map-timer">
            NEXT MAP: <span className="timer-val">{formatTimer(hudData.mapTimerRemainingSec)}</span>
          </div>
        </div>

        {/* Right: Attack, Power Cooldown, Scoreboard & Actions */}
        <div className="stiki-hud-actions">
          {/* Attack Key Indicator */}
          <div className={`stiki-action-indicator ${activeKeys.J ? 'active' : ''}`} title="Basic Attack: Press [J] or Left Click">
            <span className="key-pill">J</span>
            <span className="action-text">STRIKE</span>
          </div>

          {/* Special Skill Card */}
          <div
            className={`stiki-skill-card ${isSkillReady ? 'ready' : 'on-cooldown'} ${activeKeys.K || activeKeys.E ? 'active-pressed' : ''}`}
            title={`Special: ${hudData.power?.name} (Press [K] or [E])`}
          >
            <span className="stiki-skill-icon">{hudData.power?.icon || '⚡'}</span>
            <div className="stiki-skill-label">
              <span className="skill-name">{hudData.power?.name || 'Skill'}</span>
              <span className="skill-cd">
                {isSkillReady ? (
                  <span className="ready-badge">READY <span className="key-pill pill-sm">K</span></span>
                ) : (
                  `${skillCdSec}s`
                )}
              </span>
            </div>
          </div>

          <div className="stiki-score-badge">
            <span className="score-kill">⚔️ {hudData.kills}</span>
            <span className="score-divider">/</span>
            <span className="score-death">💀 {hudData.deaths}</span>
          </div>

          <button
            className="stiki-audio-btn"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button className="stiki-leave-btn" onClick={onLeave}>
            Exit
          </button>
        </div>
      </div>

      {/* Phaser Canvas Viewport Container */}
      <div className="stiki-canvas-container" ref={gameContainerRef} />

      {/* Touch Action Controls for Mobile */}
      <div className="stiki-touch-controls">
        <div className="touch-group-left">
          <button className="touch-btn drop-btn" onTouchStart={handleTouchDropDown} onClick={handleTouchDropDown}>
            ⬇ Drop
          </button>
        </div>
        <div className="touch-group-right">
          <button className="touch-btn jump-btn" onTouchStart={handleTouchJump} onClick={handleTouchJump}>
            ⬆ Jump
          </button>
          <button className="touch-btn attack-btn" onTouchStart={handleTouchAttack} onClick={handleTouchAttack}>
            🥊 Attack [J]
          </button>
          <button
            className={`touch-btn skill-btn ${isSkillReady ? 'ready' : ''}`}
            onTouchStart={handleTouchSkill}
            onClick={handleTouchSkill}
            disabled={!isSkillReady}
          >
            {hudData.power?.icon} Skill [K]
          </button>
        </div>
      </div>

      {/* Interactive Black Neumorphic Laptop Controls Dock */}
      <div className="stiki-neumorphic-dock">
        <div className="dock-status-cluster">
          <span className="dock-led" />
          <span className="dock-title">LAPTOP CONTROLS</span>
        </div>

        <div className="dock-divider" />

        <div className="dock-group">
          <span className="dock-label">MOVE</span>
          <div className="keycap-cluster">
            <div className={`keycap ${activeKeys.A ? 'pressed' : ''}`} title="Move Left (A / ◀)">
              <span className="keycap-main">A</span>
              <span className="keycap-sub">◀</span>
            </div>
            <div className={`keycap ${activeKeys.D ? 'pressed' : ''}`} title="Move Right (D / ▶)">
              <span className="keycap-main">D</span>
              <span className="keycap-sub">▶</span>
            </div>
          </div>
        </div>

        <div className="dock-divider" />

        <div className="dock-group">
          <span className="dock-label">JUMP & DROP</span>
          <div className="keycap-cluster">
            <div className={`keycap keycap-wide ${activeKeys.W || activeKeys.SPACE ? 'pressed' : ''}`} title="Jump & Double Jump (Space / W)">
              <span className="keycap-main">W / SPACE</span>
              <span className="keycap-sub">JUMP ×2</span>
            </div>
            <div className={`keycap keycap-wide ${(activeKeys.S && activeKeys.SPACE) ? 'pressed' : ''}`} title="Drop Down Platform (S + Space)">
              <span className="keycap-main">S + SPACE</span>
              <span className="keycap-sub">DROP</span>
            </div>
          </div>
        </div>

        <div className="dock-divider" />

        <div className="dock-group">
          <span className="dock-label">ACTIONS</span>
          <div className="keycap-cluster">
            <div className={`keycap keycap-attack ${activeKeys.J ? 'pressed' : ''}`} title="Basic Strike: Press J or Left-Click">
              <span className="keycap-main">J</span>
              <span className="keycap-sub">ATTACK</span>
            </div>
            <div
              className={`keycap keycap-skill ${isSkillReady ? 'ready' : 'cd'} ${activeKeys.K || activeKeys.E ? 'pressed' : ''}`}
              title={`Special Skill: Press K or E (${hudData.power?.name || 'Ability'})`}
            >
              <span className="keycap-main">K / E</span>
              <span className="keycap-sub">{isSkillReady ? 'SPECIAL' : `${skillCdSec}s`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
