import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Engine } from '../game/engine';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SKIN_COLORS = {
  standard: '#A0A8B0',
  rusty: '#8B6B4A',
  golden: '#FFD700',
  neon: '#00FFB3',
  ember: '#FF5533',
  frost: '#88DDFF',
  shadow: '#8B5CF6',
  scrap_special: '#7DA5BD',
};

const GameCanvas = forwardRef(({
  onStateChange, onScrapEarned, onAchievement, onRunComplete,
  startLevel = 0, paused = false, settings,
  assistDamageLevel = 0, assistStabilizerLevel = 0,
  equippedSkin = 'standard',
  speedrunMode = false,
  dailyMode = false, dailyModifier = null,
  persistentTotalCoins = 0, persistentTotalScrap = 0,
  unlockedAchievements = [],
}, ref) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const handleStateChange = useCallback((state) => {
    if (onStateChange) onStateChange(state);
  }, [onStateChange]);

  useImperativeHandle(ref, () => ({
    get engine() { return engineRef.current; },
    get camera() { return engineRef.current?.camera; },
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, handleStateChange);
    engineRef.current = engine;

    // Initial settings + persistence-derived flags before start
    if (settings) {
      engine.camera.shakeEnabled = settings.screenShake !== false;
    }
    engine.speedrunMode = !!speedrunMode;
    engine.dailyMode = !!dailyMode;
    engine.dailyModifier = dailyModifier;
    engine.equippedSkin = equippedSkin;
    engine.persistentTotalCoins = persistentTotalCoins;
    engine.persistentTotalScrap = persistentTotalScrap;
    // Seed the achievement tracker with already-unlocked ids so we don't re-fire toasts
    unlockedAchievements.forEach(id => engine.achievements.unlocked.add(id));
    engine.onAchievementUnlock = (id) => { if (onAchievement) onAchievement(id); };

    // Save score + run stats on game over / victory
    const origOnState = engine.onStateChange;
    engine.onStateChange = (state) => {
      origOnState(state);
      if (state === 'gameover' || state === 'victory') {
        const score = engine.gameState.score;
        const coins = engine.gameState.coins;
        const scrapParts = engine.gameState.scrapParts || 0;
        fetch(`${BACKEND_URL}/api/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score, coins, level: engine.currentLevelIndex }),
        }).catch(() => {});
        if (scrapParts > 0 && onScrapEarned) onScrapEarned(scrapParts, score, coins);
        if (state === 'victory' && onRunComplete) {
          onRunComplete({
            finalMs: engine.runFinalMs || engine.runTimerMs || 0,
            level1Ms: engine.achievements?.level1TimeMs || 0,
          });
        }
      }
    };

    engine.start(startLevel);

    return () => {
      engine.stop();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Propagate pause to engine
  useEffect(() => {
    if (engineRef.current) engineRef.current.paused = paused;
  }, [paused]);

  // Propagate settings changes
  useEffect(() => {
    if (engineRef.current && settings) {
      engineRef.current.camera.shakeEnabled = settings.screenShake !== false;
      engineRef.current.showFpsOverlay = !!settings.showFps;
    }
  }, [settings]);

  // Propagate assist upgrade levels
  useEffect(() => {
    if (!engineRef.current) return;
    const dmgMap = [0, 0.05, 0.10, 0.15];
    const redMap = [0, 0.05, 0.10, 0.15];
    engineRef.current.assistUpgradeBonus = dmgMap[Math.max(0, Math.min(3, assistDamageLevel))];
    engineRef.current.assistMalfunctionReduction = redMap[Math.max(0, Math.min(3, assistStabilizerLevel))];
  }, [assistDamageLevel, assistStabilizerLevel]);

  // Propagate equipped skin → player color
  useEffect(() => {
    if (!engineRef.current || !engineRef.current.player) return;
    engineRef.current.equippedSkin = equippedSkin;
    engineRef.current.player.skinColor = SKIN_COLORS[equippedSkin] || SKIN_COLORS.standard;
  }, [equippedSkin]);

  // Propagate speedrun flag
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.speedrunMode = !!speedrunMode;
  }, [speedrunMode]);

  // Propagate daily mode / modifier
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.dailyMode = !!dailyMode;
    engineRef.current.dailyModifier = dailyModifier;
  }, [dailyMode, dailyModifier]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="game-canvas"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;
