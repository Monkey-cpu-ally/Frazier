import React, { useState, useCallback, useRef } from 'react';
import '@/App.css';
import GameCanvas from '@/components/GameCanvas';
import MainMenu from '@/components/MainMenu';
import PauseMenu from '@/components/PauseMenu';
import SettingsPanel from '@/components/SettingsPanel';
import DialogueOverlay from '@/components/DialogueOverlay';
import { sfx } from '@/game/sfx';
import { KeyCap } from '@/components/gameui';

const BG_URL = 'https://static.prod-images.emergentagent.com/jobs/373297d6-1933-47c6-98ac-bd4bef2c6b43/images/e352993c8b6ad491a1f19da7bb7f3a7aa5ade71deb48994a814b5024daf01114.png';
const CHAR_URL = 'https://customer-assets.emergentagent.com/job_agent-platform-73/artifacts/3vnrayz5_download%20%282%29.jpeg';
const LOGO_URL = 'https://static.prod-images.emergentagent.com/jobs/373297d6-1933-47c6-98ac-bd4bef2c6b43/images/b9f1e61660d975d35abd57e13d38465e838517983dcb816893171db757fb203e.png';
const SCRAP_URL = 'https://customer-assets.emergentagent.com/job_agent-platform-73/artifacts/65k5qqhf_file_00000000b57c71fbb0f6cfcc4204d795.png';

const DEFAULT_SETTINGS = {
  sfxVolume: 35,
  musicVolume: 50,
  screenShake: true,
  showFps: false,
  dialogueAuto: false,
};

function App() {
  // Screen states: title -> menu -> playing
  const [screen, setScreen] = useState('title');
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [startLevel, setStartLevel] = useState(0);
  const engineRef = useRef(null);

  // Apply settings
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
    sfx.volume = newSettings.sfxVolume / 100;
    sfx.enabled = newSettings.sfxVolume > 0;
    if (engineRef.current) {
      engineRef.current.camera && (engineRef.current.camera.shakeEnabled = newSettings.screenShake);
    }
  }, []);

  const handleGameState = useCallback((state) => {
    // Game engine state changes
  }, []);

  const goToMenu = () => {
    sfx.uiClick();
    setScreen('menu');
  };

  const startGame = (levelIndex = 0) => {
    sfx.uiStart();
    setStartLevel(levelIndex);
    setScreen('playing');
    setPaused(false);
  };

  const handlePause = useCallback(() => {
    setPaused(p => !p);
    sfx.uiClick();
  }, []);

  const handleQuitToMenu = () => {
    setPaused(false);
    setScreen('menu');
    sfx.uiClick();
  };

  const handleRestart = () => {
    setPaused(false);
    setScreen('restart');
    setTimeout(() => {
      setScreen('playing');
    }, 50);
    sfx.uiClick();
  };

  // Global ESC handler for pause
  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Escape' && screen === 'playing') {
        handlePause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen, handlePause]);

  return (
    <div className="app-root" data-testid="app-root">
      <div className="game-wrapper" data-testid="game-wrapper">

        {/* ===== TITLE SCREEN ===== */}
        {screen === 'title' && (
          <div className="title-screen" data-testid="title-screen">
            <div className="title-bg" style={{ backgroundImage: `url(${BG_URL})` }}>
              <div className="title-overlay" />
              <div className="title-content">
                <div className="title-left">
                  <img
                    src={LOGO_URL}
                    alt="HYPER AXEL"
                    className="title-logo"
                    data-testid="game-title-logo"
                  />
                  <p className="title-sub">Wrenchbound</p>
                  <div className="title-buttons">
                    <button
                      className="start-btn"
                      data-testid="start-game-button"
                      onClick={goToMenu}
                    >
                      PLAY
                    </button>
                    <button
                      className="controls-btn"
                      data-testid="controls-button"
                      onClick={() => setShowControls(true)}
                    >
                      CONTROLS
                    </button>
                  </div>
                </div>
                <div className="title-right">
                  <img
                    src={CHAR_URL}
                    alt="Axel"
                    className="title-character"
                    data-testid="title-character-art"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MAIN MENU ===== */}
        {screen === 'menu' && (
          <div className="menu-screen" data-testid="menu-screen" style={{ backgroundImage: `url(${BG_URL})` }}>
            <div className="menu-overlay" />
            <div className="menu-content">
              <MainMenu
                onPlay={startGame}
                onLevelSelect={startGame}
                charUrl={CHAR_URL}
                scrapUrl={SCRAP_URL}
              />
            </div>
          </div>
        )}

        {/* ===== GAME SCREEN ===== */}
        {(screen === 'playing') && (
          <div className="game-screen" data-testid="game-screen">
            <GameCanvas
              onStateChange={handleGameState}
              startLevel={startLevel}
              paused={paused}
              settings={settings}
              ref={engineRef}
            />

            {/* Pause Menu Overlay */}
            {paused && (
              <PauseMenu
                onResume={handlePause}
                onRestart={handleRestart}
                onSettings={() => setShowSettings(true)}
                onControls={() => setShowControls(true)}
                onQuit={handleQuitToMenu}
              />
            )}
          </div>
        )}

        {/* ===== SETTINGS MODAL ===== */}
        <SettingsPanel
          open={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />

        {/* ===== CONTROLS OVERLAY ===== */}
        {showControls && (
          <div className="controls-overlay" data-testid="controls-overlay" onClick={() => setShowControls(false)}>
            <div className="controls-panel" onClick={(e) => e.stopPropagation()}>
              <h2 className="controls-title">CONTROLS</h2>
              <div className="controls-grid">
                <ControlRow keys={['A', 'D']} action="Move Left / Right" />
                <ControlRow keys={['SPACE']} action="Jump" />
                <ControlRow keys={['X', 'J']} action="Swing Wrench" />
                <ControlRow keys={['S', '+', 'X']} action="Downward Smash (in air)" />
                <ControlRow keys={['K', 'Z']} action="Special / Use Power" />
                <ControlRow keys={['E']} action="Interact" />
                <ControlRow keys={['TAB']} action="Flight Log" />
                <ControlRow keys={['ESC']} action="Pause" />
              </div>
              <div className="controls-tips">
                <h3>Combat Tips</h3>
                <ul>
                  <li>Chain 3 ground attacks for a wrench combo</li>
                  <li>Use downward smash to break cracked floors</li>
                  <li>Collect power orbs for 15-second abilities</li>
                  <li>Burning Buffalo lets you charge through walls</li>
                  <li>Hit the boss during its vulnerable phase</li>
                </ul>
              </div>
              <button
                className="close-btn"
                data-testid="close-controls-button"
                onClick={() => setShowControls(false)}
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlRow({ keys, action }) {
  return (
    <div className="control-row">
      <div className="key-group">
        {keys.map((k, i) => (
          <React.Fragment key={i}>
            {k === '+' ? <span style={{ color: 'rgba(255,255,255,0.3)' }}>+</span> : <kbd>{k}</kbd>}
          </React.Fragment>
        ))}
      </div>
      <span>{action}</span>
    </div>
  );
}

export default App;
