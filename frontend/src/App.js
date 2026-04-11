import React, { useState, useCallback } from 'react';
import '@/App.css';
import GameCanvas from '@/components/GameCanvas';

const BG_URL = 'https://static.prod-images.emergentagent.com/jobs/373297d6-1933-47c6-98ac-bd4bef2c6b43/images/9bd20862f1893c7ac3624820fc882408e152c31c47e6fe43d6f18eb820a686c3.png';
const CHAR_URL = 'https://static.prod-images.emergentagent.com/jobs/373297d6-1933-47c6-98ac-bd4bef2c6b43/images/ccc10ae8614cd9d388b09db4d8b5b75f7e2e25f19a8cedfb88c9229fced9a361.png';

function App() {
  const [screen, setScreen] = useState('title');
  const [showControls, setShowControls] = useState(false);

  const handleGameState = useCallback((state) => {
    if (state === 'gameover' || state === 'victory') {
      // Game handles its own overlays on canvas
    }
  }, []);

  const startGame = () => {
    setScreen('playing');
  };

  return (
    <div className="app-root" data-testid="app-root">
      <div className="game-wrapper" data-testid="game-wrapper">
        {/* Title Screen */}
        {screen === 'title' && (
          <div className="title-screen" data-testid="title-screen">
            <div className="title-bg" style={{ backgroundImage: `url(${BG_URL})` }}>
              <div className="title-overlay" />
              <div className="title-content">
                <div className="title-left">
                  <h1 className="title-text" data-testid="game-title">
                    HYPER<br />AXEL
                  </h1>
                  <p className="title-sub">Wrenchbound</p>
                  <button
                    className="start-btn"
                    data-testid="start-game-button"
                    onClick={startGame}
                  >
                    START GAME
                  </button>
                  <button
                    className="controls-btn"
                    data-testid="controls-button"
                    onClick={() => setShowControls(true)}
                  >
                    CONTROLS
                  </button>
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

        {/* Game Screen */}
        {screen === 'playing' && (
          <div className="game-screen" data-testid="game-screen">
            <GameCanvas onStateChange={handleGameState} />
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <div className="controls-overlay" data-testid="controls-overlay" onClick={() => setShowControls(false)}>
            <div className="controls-panel" onClick={(e) => e.stopPropagation()}>
              <h2 className="controls-title">CONTROLS</h2>
              <div className="controls-grid">
                <div className="control-row">
                  <div className="key-group">
                    <kbd>A</kbd><kbd>D</kbd>
                  </div>
                  <span>Move Left / Right</span>
                </div>
                <div className="control-row">
                  <div className="key-group">
                    <kbd>SPACE</kbd>
                  </div>
                  <span>Jump</span>
                </div>
                <div className="control-row">
                  <div className="key-group">
                    <kbd>X</kbd> or <kbd>J</kbd>
                  </div>
                  <span>Swing Wrench</span>
                </div>
                <div className="control-row">
                  <div className="key-group">
                    <kbd>S</kbd> + <kbd>X</kbd>
                  </div>
                  <span>Downward Smash (in air)</span>
                </div>
                <div className="control-row">
                  <div className="key-group">
                    <kbd>K</kbd> or <kbd>Z</kbd>
                  </div>
                  <span>Special / Use Power</span>
                </div>
                <div className="control-row">
                  <div className="key-group">
                    <kbd>E</kbd>
                  </div>
                  <span>Interact</span>
                </div>
              </div>
              <div className="controls-tips">
                <h3>Combat Tips</h3>
                <ul>
                  <li>Chain 3 ground attacks for a wrench combo</li>
                  <li>Use downward smash to break cracked floors</li>
                  <li>Collect power orbs for 15-second abilities</li>
                  <li>Burning Buffalo lets you charge through walls</li>
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

export default App;
