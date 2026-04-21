import React from 'react';
import {
  PanelHeader, PanelBody, PanelFooter,
  GameButton, GameBadge, TerminalText,
} from './gameui';

const WORLDS = [
  {
    id: 'story',
    name: 'Story Campaign',
    desc: 'The original 10-level arc. Defeat the Siege Core and collect mirror fragments.',
    color: '#FFD60A',
    icon: '▶',
  },
  {
    id: 'dream',
    name: 'Dream World',
    desc: 'Procedural. Floaty gravity. Dream creatures blink in and out of view.',
    color: '#FFB3FF',
    icon: '✦',
  },
  {
    id: 'lava',
    name: 'Emberfall',
    desc: 'Lava biome. Fire beasts. The ground runs hot.',
    color: '#FF5533',
    icon: '◆',
  },
  {
    id: 'sky',
    name: 'Cloudspire',
    desc: 'Floating islands. Sky serpents. One wrong step is a long fall.',
    color: '#88DDFF',
    icon: '☁',
  },
  {
    id: 'forest',
    name: 'Verdanthold',
    desc: 'Mystic forest. Spirit creatures. A waterfall event cascades mid-run.',
    color: '#AADDFF',
    icon: '✿',
  },
];

const WorldPicker = ({ open, onClose, onChoose }) => {
  if (!open) return null;
  return (
    <div className="gui-modal-overlay" onClick={onClose} data-testid="world-picker-overlay">
      <div className="gui-panel gui-panel--bordered gui-modal gui-modal--wide" onClick={e => e.stopPropagation()}>
        <PanelHeader
          title="CHOOSE WORLD"
          subtitle="[ Mission Gate — Deploy to a new biome ]"
          right={<GameBadge color="red">MISSION GATE</GameBadge>}
        />
        <PanelBody>
          <TerminalText>[ Available Deployments ]</TerminalText>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 14, marginTop: 14,
          }}>
            {WORLDS.map(w => (
                <div
                  key={w.id}
                  data-testid={`world-${w.id}`}
                  onClick={() => onChoose && onChoose(w.id)}
                  style={{
                    padding: 16,
                    background: 'rgba(12,18,24,0.6)',
                    border: `2px solid ${w.color}55`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = w.color;
                  e.currentTarget.style.background = 'rgba(12,18,24,0.85)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${w.color}55`;
                  e.currentTarget.style.background = 'rgba(12,18,24,0.6)';
                }}
              >
                {/* Icon halo */}
                <div style={{
                  position: 'absolute', top: -20, right: -20,
                  fontSize: 110, color: `${w.color}18`,
                  fontFamily: 'Anton, sans-serif',
                  pointerEvents: 'none',
                }}>{w.icon}</div>
                <div style={{
                  fontFamily: 'Anton, sans-serif',
                  fontSize: '0.75rem', color: w.color, letterSpacing: 2,
                }}>
                  WORLD · {w.id.toUpperCase()}
                </div>
                <div style={{
                  fontFamily: 'Fredoka, sans-serif', fontWeight: 800,
                  fontSize: '1.25rem', color: '#E8F0EC',
                  margin: '4px 0 8px',
                }}>{w.name}</div>
                <div style={{
                  fontFamily: 'Nunito, sans-serif', fontSize: '0.82rem',
                  color: '#C5D5CC', lineHeight: 1.4,
                }}>{w.desc}</div>
                <div style={{ marginTop: 10 }}>
                  <GameButton
                    variant="secondary"
                    full
                    data-testid={`world-${w.id}-btn`}
                    onClick={(e) => { e && e.stopPropagation && e.stopPropagation(); onChoose && onChoose(w.id); }}
                  >
                    DEPLOY
                  </GameButton>
                </div>
              </div>
            ))}
          </div>
        </PanelBody>
        <PanelFooter>
          <TerminalText>Pick a destination. Your scrap & skins carry over.</TerminalText>
          <GameButton variant="ghost" onClick={onClose} data-testid="world-picker-close-btn">
            BACK TO HUB
          </GameButton>
        </PanelFooter>
      </div>
    </div>
  );
};

export default WorldPicker;
