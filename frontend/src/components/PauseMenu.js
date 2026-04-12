import React from 'react';
import {
  GamePanel, PanelHeader, PanelBody,
  GameButton, Divider, TerminalText,
} from './gameui';

const PauseMenu = ({ onResume, onRestart, onSettings, onControls, onQuit }) => (
  <div className="pause-overlay" data-testid="pause-menu">
    <GamePanel variant="bordered" className="pause-panel">
      <PanelHeader title="PAUSED" subtitle="[ Systems on standby ]" />
      <PanelBody>
        <div className="pause-buttons">
          <GameButton variant="primary" full onClick={onResume} data-testid="pause-resume-btn">
            RESUME
          </GameButton>
          <GameButton variant="ghost" full onClick={onSettings} data-testid="pause-settings-btn">
            SETTINGS
          </GameButton>
          <GameButton variant="ghost" full onClick={onControls} data-testid="pause-controls-btn">
            CONTROLS
          </GameButton>
          <Divider dashed />
          <GameButton variant="ghost" full onClick={onRestart} data-testid="pause-restart-btn">
            RESTART LEVEL
          </GameButton>
          <GameButton variant="ghost" full onClick={onQuit} data-testid="pause-quit-btn">
            QUIT TO MENU
          </GameButton>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <TerminalText>Press ESC to resume</TerminalText>
        </div>
      </PanelBody>
    </GamePanel>
  </div>
);

export default PauseMenu;
