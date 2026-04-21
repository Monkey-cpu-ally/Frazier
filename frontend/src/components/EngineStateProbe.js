import React, { useEffect, useState } from 'react';

/**
 * Hidden DOM markers that mirror in-game canvas state so automated
 * tests can verify gameplay events without pixel inspection.
 * Polls the engine ref at ~4Hz.
 */
const EngineStateProbe = ({ engineRef }) => {
  const [state, setState] = useState({
    levelName: '',
    waterfallActive: false,
    bossArenaActive: false,
    hyperModeActive: false,
    dailyActive: false,
    biome: '',
  });

  useEffect(() => {
    const tick = () => {
      const eng = engineRef?.current?.engine;
      if (!eng) return;
      setState({
        levelName: eng.currentLevel?.name || '',
        waterfallActive: !!eng.waterfallActive,
        bossArenaActive: !!eng.bossArenaActive,
        hyperModeActive: !!eng.powerManager?.isHyperMode,
        dailyActive: !!eng.dailyMode,
        biome: eng.biome || '',
      });
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [engineRef]);

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <span data-testid="current-level-name">{state.levelName}</span>
      <span data-testid="current-biome">{state.biome}</span>
      <span data-testid="waterfall-active">{state.waterfallActive ? '1' : '0'}</span>
      <span data-testid="boss-arena-active">{state.bossArenaActive ? '1' : '0'}</span>
      <span data-testid="hyper-mode-active">{state.hyperModeActive ? '1' : '0'}</span>
      <span data-testid="daily-active">{state.dailyActive ? '1' : '0'}</span>
    </div>
  );
};

export default EngineStateProbe;
