import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Engine } from '../game/engine';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const GameCanvas = ({ onStateChange }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const handleStateChange = useCallback((state) => {
    if (onStateChange) onStateChange(state);
  }, [onStateChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, handleStateChange);
    engineRef.current = engine;
    engine.start();

    // Save score on game over
    const origOnState = engine.onStateChange;
    engine.onStateChange = (state) => {
      origOnState(state);
      if (state === 'gameover' || state === 'victory') {
        const score = engine.gameState.score;
        const coins = engine.gameState.coins;
        fetch(`${BACKEND_URL}/api/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score, coins, level: engine.currentLevelIndex }),
        }).catch(() => {});
      }
    };

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [handleStateChange]);

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
};

export default GameCanvas;
