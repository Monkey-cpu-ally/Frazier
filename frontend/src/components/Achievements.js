import React, { useState, useEffect } from 'react';
import {
  GamePanel, PanelHeader, PanelBody, PanelFooter,
  GameButton, GameBadge, Divider, TerminalText,
} from './gameui';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ACHIEVEMENT_ICONS = {
  first_blood: '{ }',
  combo_master: '***',
  coin_collector: '$$$',
  scrap_hoarder: '[S]',
  power_user: '(P)',
  wall_jumper: '|^|',
  dasher: '>>>', 
  boss_slayer: '[B]',
  fragment_1: '<>',
  fragment_all: '<*>',
  no_damage_level: '(0)',
  speed_run: '>>>',
  explorer: '?!?',
  all_levels: '[X]',
  high_score: '###',
};

const Achievements = ({ open, onClose, unlockedIds = [] }) => {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (open) {
      fetch(`${BACKEND_URL}/api/achievements`)
        .then(r => r.json())
        .then(setAchievements)
        .catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const unlockedSet = new Set(unlockedIds);

  return (
    <div className="gui-modal-overlay" onClick={onClose} data-testid="achievements-overlay">
      <div className="gui-panel gui-panel--bordered gui-modal gui-modal--wide" onClick={e => e.stopPropagation()}>
        <PanelHeader
          title="ACHIEVEMENTS"
          subtitle={`[ ${unlockedIds.length}/${achievements.length} Unlocked ]`}
        />
        <PanelBody className="gui-scroll" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {achievements.map(a => {
              const unlocked = unlockedSet.has(a.id);
              return (
                <div
                  key={a.id}
                  data-testid={`achievement-${a.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: unlocked ? 'rgba(0,199,190,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${unlocked ? 'rgba(0,199,190,0.3)' : 'var(--gui-border)'}`,
                    borderRadius: 10,
                    opacity: unlocked ? 1 : 0.45,
                  }}
                >
                  <div style={{
                    width: 40, height: 40,
                    borderRadius: 8,
                    background: unlocked ? 'rgba(0,199,190,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${unlocked ? 'var(--gui-accent)' : 'var(--gui-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700,
                    color: unlocked ? 'var(--gui-accent)' : 'var(--gui-text-muted)',
                  }}>
                    {ACHIEVEMENT_ICONS[a.id] || '???'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'Fredoka', fontWeight: 700, fontSize: '0.85rem',
                      color: unlocked ? '#E8F0EC' : '#4A6458',
                    }}>
                      {a.name}
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                      color: '#7A9488', marginTop: 2,
                    }}>
                      {a.desc}
                    </div>
                  </div>
                  {unlocked && <GameBadge color="teal">DONE</GameBadge>}
                </div>
              );
            })}
          </div>
        </PanelBody>
        <PanelFooter>
          <TerminalText>Achievements persist across sessions.</TerminalText>
          <GameButton variant="ghost" onClick={onClose} data-testid="achievements-close-btn">CLOSE</GameButton>
        </PanelFooter>
      </div>
    </div>
  );
};

export default Achievements;
