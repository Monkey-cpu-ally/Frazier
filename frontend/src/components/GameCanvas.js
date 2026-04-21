import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Engine } from '../game/engine';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const GameCanvas = forwardRef(({
  onStateChange, onScrapEarned, startLevel = 0, paused = false, settings,
  assistDamageLevel = 0, assistStabilizerLevel = 0,
}, ref) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const handleStateChange = useCallback((state) => {
    if (onStateChange) onStateChange(state);
  }, [onStateChange]);

  // Expose engine instance to parent
  useImperativeHandle(ref, () => ({
    get engine() { return engineRef.current; },
    get camera() { return engineRef.current?.camera; },
  }), []);

  // Initialize engine ONCE
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, handleStateChange);
    engineRef.current = engine;

    // Apply initial settings before start
    if (settings) {
      engine.camera.shakeEnabled = settings.screenShake !== false;
    }

    engine.start(startLevel);

    // Save score on game over / victory
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
        if (scrapParts > 0 && onScrapEarned) onScrapEarned(scrapParts, score);
      }
    };

    return () => {
      engine.stop();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Propagate pause to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.paused = paused;
    }
  }, [paused]);

  // Propagate settings changes to engine
  useEffect(() => {
    if (engineRef.current && settings) {
      engineRef.current.camera.shakeEnabled = settings.screenShake !== false;
      engineRef.current.showFpsOverlay = !!settings.showFps;
    }
  }, [settings]);

  // Propagate assist upgrade levels to engine
  useEffect(() => {
    if (!engineRef.current) return;
    // Mirror Godot tiers: 5% / 10% / 15% damage bonus; 5% / 10% / 15% malfunction reduction
    const dmgMap = [0, 0.05, 0.10, 0.15];
    const redMap = [0, 0.05, 0.10, 0.15];
    engineRef.current.assistUpgradeBonus = dmgMap[Math.max(0, Math.min(3, assistDamageLevel))];
    engineRef.current.assistMalfunctionReduction = redMap[Math.max(0, Math.min(3, assistStabilizerLevel))];
  }, [assistDamageLevel, assistStabilizerLevel]);

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
