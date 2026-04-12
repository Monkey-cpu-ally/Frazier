import React from 'react';
import {
  GameModal, PanelHeader, PanelBody, PanelFooter,
  GameButton, GameSlider, GameToggle, Divider,
} from './gameui';

const SettingsPanel = ({ open, onClose, settings, onSettingsChange }) => (
  <GameModal open={open} onClose={onClose} width="narrow">
    <PanelHeader title="SETTINGS" subtitle="[ Configuration ]" />
    <PanelBody>
      <GameSlider
        label="SFX Volume"
        value={settings.sfxVolume}
        onChange={v => onSettingsChange({ ...settings, sfxVolume: v })}
      />
      <div style={{ height: 16 }} />
      <GameSlider
        label="Music Volume"
        value={settings.musicVolume}
        onChange={v => onSettingsChange({ ...settings, musicVolume: v })}
      />
      <Divider />
      <GameToggle
        label="Screen Shake"
        checked={settings.screenShake}
        onChange={v => onSettingsChange({ ...settings, screenShake: v })}
      />
      <div style={{ height: 8 }} />
      <GameToggle
        label="Show FPS"
        checked={settings.showFps}
        onChange={v => onSettingsChange({ ...settings, showFps: v })}
      />
      <div style={{ height: 8 }} />
      <GameToggle
        label="Dialogue Auto-Play"
        checked={settings.dialogueAuto}
        onChange={v => onSettingsChange({ ...settings, dialogueAuto: v })}
      />
    </PanelBody>
    <PanelFooter>
      <GameButton variant="secondary" onClick={onClose} data-testid="settings-close-btn">
        DONE
      </GameButton>
    </PanelFooter>
  </GameModal>
);

export default SettingsPanel;
