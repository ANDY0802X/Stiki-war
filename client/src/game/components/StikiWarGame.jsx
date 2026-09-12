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

    // Pass data into scenes
    game.scene.start('BootScene');
    game.events.once('ready', () => {
      const arena = game.scene.getScene('ArenaScene');
      if (arena) {
        arena.scene.restart({
          socket,
          username,
          userColor,
          onHudUpdate: (data) => setHudData((prev) => ({ ...prev, ...data }))
        });
      }
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

        {/* Right: Power Cooldown, Scoreboard & Actions */}
        <div className="stiki-hud-actions">
          <div
            className={`stiki-skill-card ${isSkillReady ? 'ready' : 'on-cooldown'}`}
            title={`Special: ${hudData.power?.name}`}
          >
            <span className="stiki-skill-icon">{hudData.power?.icon || '⚡'}</span>
            <div className="stiki-skill-label">
              <span className="skill-name">{hudData.power?.name || 'Skill'}</span>
              <span className="skill-cd">{isSkillReady ? 'READY [K]' : `${skillCdSec}s`}</span>
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
            Exit Arena
          </button>
        </div>
      </div>

      {/* Phaser Canvas Viewport Container */}
      <div className="stiki-canvas-container" ref={gameContainerRef} />

      {/* Touch Action Controls for Mobile / Emulation */}
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
            🥊 Attack
          </button>
          <button
            className={`touch-btn skill-btn ${isSkillReady ? 'ready' : ''}`}
            onTouchStart={handleTouchSkill}
            onClick={handleTouchSkill}
            disabled={!isSkillReady}
          >
            {hudData.power?.icon} Skill
          </button>
        </div>
      </div>

      {/* Desktop Controls Helper Banner */}
      <div className="stiki-controls-guide">
        <span><b>Movement:</b> A/D or ←/→</span>
        <span><b>Jump / Double Jump:</b> Space or W</span>
        <span><b>Drop Down:</b> S + Space</span>
        <span><b>Attack:</b> J / Left Click</span>
        <span><b>Special:</b> K or E (7s CD)</span>
      </div>
    </div>
  );
}
