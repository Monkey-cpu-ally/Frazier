import React, { useState } from 'react';
import {
  GamePanel, PanelHeader, PanelBody, PanelFooter,
  GameButton, GameBadge, Divider, TerminalText, MeterBar,
} from './gameui';

const WRENCH_SKINS = [
  { id: 'standard', name: 'Standard Wrench', color: '#A0A8B0', cost: 0, unlocked: true },
  { id: 'rusty', name: 'Rusty Iron', color: '#8B6B4A', cost: 50, unlocked: false },
  { id: 'golden', name: 'Golden Spanner', color: '#FFD700', cost: 150, unlocked: false },
  { id: 'neon', name: 'Neon Edge', color: '#00FFB3', cost: 200, unlocked: false },
  { id: 'ember', name: 'Ember Forge', color: '#FF5533', cost: 300, unlocked: false },
  { id: 'frost', name: 'Frost Breaker', color: '#88DDFF', cost: 250, unlocked: false },
  { id: 'shadow', name: 'Void Wrench', color: '#8B5CF6', cost: 400, unlocked: false },
  { id: 'scrap_special', name: "Scrap's Legacy", color: '#7DA5BD', cost: 500, unlocked: false },
];

const Workshop = ({ open, onClose, scrapParts = 0 }) => {
  const [selected, setSelected] = useState('standard');
  const [skins, setSkins] = useState(WRENCH_SKINS);

  if (!open) return null;

  const selectedSkin = skins.find(s => s.id === selected);

  const handleUnlock = (skinId) => {
    const skin = skins.find(s => s.id === skinId);
    if (!skin || skin.unlocked || scrapParts < skin.cost) return;
    setSkins(prev => prev.map(s =>
      s.id === skinId ? { ...s, unlocked: true } : s
    ));
  };

  return (
    <div className="gui-modal-overlay" onClick={onClose} data-testid="workshop-overlay">
      <div className="gui-panel gui-panel--bordered gui-modal gui-modal--wide" onClick={e => e.stopPropagation()}>
        <PanelHeader
          title="SCRAP'S WORKSHOP"
          subtitle="[ Wrench Customization Bay ]"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GameBadge color="teal">{scrapParts} SCRAP</GameBadge>
            </div>
          }
        />

        <PanelBody>
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Wrench Preview */}
            <div style={{ flex: '0 0 200px', textAlign: 'center' }}>
              <div style={{
                width: 180, height: 220,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 16,
                border: '2px solid var(--gui-border)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Wrench visualization */}
                <svg width="80" height="160" viewBox="0 0 80 160">
                  <rect x="36" y="60" width="8" height="80" rx="2" fill={selectedSkin?.color || '#A0A8B0'} />
                  <rect x="28" y="130" width="24" height="16" rx="3" fill="#D43A2A" />
                  <rect x="20" y="10" width="40" height="55" rx="6" fill={selectedSkin?.color || '#A0A8B0'} />
                  <rect x="28" y="10" width="8" height="20" rx="2" fill="rgba(0,0,0,0.3)" />
                  <rect x="44" y="10" width="8" height="20" rx="2" fill="rgba(0,0,0,0.3)" />
                  <rect x="26" y="8" width="28" height="6" rx="2" fill={selectedSkin?.color || '#A0A8B0'} opacity="0.8" />
                </svg>

                {/* Glow effect for special skins */}
                {selectedSkin?.cost >= 300 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(circle, ${selectedSkin.color}15, transparent 70%)`,
                  }} />
                )}
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontFamily: 'Fredoka', fontWeight: 700, color: '#E8F0EC', fontSize: '1rem' }}>
                  {selectedSkin?.name}
                </div>
                {selectedSkin?.unlocked ? (
                  <GameBadge color="teal">EQUIPPED</GameBadge>
                ) : (
                  <GameBadge color="yellow">{selectedSkin?.cost} SCRAP</GameBadge>
                )}
              </div>
            </div>

            {/* Skin Grid */}
            <div style={{ flex: 1 }}>
              <TerminalText>[ Available Modifications ]</TerminalText>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8, marginTop: 10,
              }}>
                {skins.map(skin => (
                  <div
                    key={skin.id}
                    onClick={() => setSelected(skin.id)}
                    data-testid={`skin-${skin.id}`}
                    style={{
                      padding: '10px 8px',
                      background: selected === skin.id ? 'rgba(0,199,190,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `2px solid ${selected === skin.id ? 'var(--gui-accent)' : 'var(--gui-border)'}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'center',
                      opacity: skin.unlocked ? 1 : 0.5,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      background: skin.color,
                      margin: '0 auto 6px',
                      border: '2px solid rgba(255,255,255,0.15)',
                      boxShadow: skin.unlocked ? `0 0 8px ${skin.color}40` : 'none',
                    }} />
                    <div style={{
                      fontFamily: 'Fredoka', fontSize: '0.65rem', fontWeight: 700,
                      color: skin.unlocked ? '#E8F0EC' : '#4A6458',
                    }}>
                      {skin.name}
                    </div>
                    {!skin.unlocked && (
                      <div style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem',
                        color: '#FFD60A', marginTop: 2,
                      }}>
                        {skin.cost} scrap
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Unlock button */}
              {selectedSkin && !selectedSkin.unlocked && (
                <div style={{ marginTop: 14 }}>
                  <GameButton
                    variant="secondary"
                    full
                    disabled={scrapParts < selectedSkin.cost}
                    onClick={() => handleUnlock(selected)}
                    data-testid="workshop-unlock-btn"
                  >
                    UNLOCK ({selectedSkin.cost} SCRAP)
                  </GameButton>
                </div>
              )}
            </div>
          </div>
        </PanelBody>

        <PanelFooter>
          <TerminalText>Scrap's modifications are permanent. Choose wisely.</TerminalText>
          <GameButton variant="ghost" onClick={onClose} data-testid="workshop-close-btn">
            CLOSE
          </GameButton>
        </PanelFooter>
      </div>
    </div>
  );
};

export default Workshop;
