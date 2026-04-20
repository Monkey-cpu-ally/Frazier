import React from 'react';
import {
  GamePanel, PanelHeader, PanelBody, PanelFooter,
  GameButton, GameBadge, Divider, TerminalText,
} from './gameui';

const LORE_ENTRIES = [
  {
    fragment: 1,
    title: 'The First Fracture',
    text: 'Before the mirrors broke, they held everything together. Reality was a single surface — seamless, whole. Then something hit it from the other side. The first crack spread across a hundred worlds in an instant.',
    color: '#FF6644',
  },
  {
    fragment: 2,
    title: 'The Builders',
    text: "They called themselves mechanics, not mages. The old builders forged mirrors from scrap and starlight. Each one was a doorway — not between places, but between what was and what could be. Scrap remembers them. He was one of their last creations.",
    color: '#44BBFF',
  },
  {
    fragment: 3,
    title: 'The Siege',
    text: 'The machines came from inside the cracks. Not evil — just lost. They were reflections of things that never existed, given form by the broken mirrors. The Rootbound Siege Tank was the largest — a war machine dreaming it was a forest.',
    color: '#AABB44',
  },
  {
    fragment: 4,
    title: 'The Key',
    text: 'Axel found the wrench in her grandmother\'s workshop. It was warm. It hummed. It recognized her hands. "You\'re the one," Scrap said when he woke up. "The mirrors have been waiting for someone who builds instead of breaks."',
    color: '#FFD700',
  },
];

const MirrorGallery = ({ open, onClose, fragmentsCollected = 0 }) => {
  if (!open) return null;

  return (
    <div className="gui-modal-overlay" onClick={onClose} data-testid="gallery-overlay">
      <div className="gui-panel gui-panel--bordered gui-modal gui-modal--wide" onClick={e => e.stopPropagation()}>
        <PanelHeader
          title="MIRROR GALLERY"
          subtitle={`[ ${fragmentsCollected}/4 Fragments Recovered ]`}
          right={
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: 24, height: 24,
                  background: i <= fragmentsCollected
                    ? `hsl(${(i - 1) * 90}, 70%, 55%)`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${i <= fragmentsCollected ? 'rgba(255,255,255,0.3)' : 'var(--gui-border)'}`,
                  borderRadius: 6,
                  transform: 'rotate(45deg)',
                  boxShadow: i <= fragmentsCollected ? `0 0 8px hsl(${(i - 1) * 90}, 70%, 55%, 0.4)` : 'none',
                }} />
              ))}
            </div>
          }
        />
        <PanelBody className="gui-scroll" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          {LORE_ENTRIES.map((entry, i) => {
            const unlocked = i < fragmentsCollected;
            return (
              <div
                key={i}
                data-testid={`lore-entry-${i}`}
                style={{
                  padding: '16px 18px',
                  marginBottom: 10,
                  background: unlocked ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)',
                  border: `1.5px solid ${unlocked ? `${entry.color}44` : 'var(--gui-border)'}`,
                  borderRadius: 12,
                  opacity: unlocked ? 1 : 0.3,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 20, height: 20,
                    background: unlocked ? entry.color : 'transparent',
                    border: `2px solid ${unlocked ? entry.color : 'var(--gui-border)'}`,
                    borderRadius: 4,
                    transform: 'rotate(45deg)',
                    boxShadow: unlocked ? `0 0 10px ${entry.color}60` : 'none',
                  }} />
                  <span style={{
                    fontFamily: 'Anton', fontSize: '1rem',
                    color: unlocked ? entry.color : '#4A6458',
                    letterSpacing: 2,
                  }}>
                    {unlocked ? entry.title : '???  LOCKED  ???'}
                  </span>
                  <GameBadge color={unlocked ? 'teal' : 'red'}>
                    Fragment {i + 1}
                  </GameBadge>
                </div>
                {unlocked ? (
                  <p style={{
                    fontFamily: 'Nunito', fontSize: '0.9rem',
                    color: '#C8D0CC', lineHeight: 1.7, margin: 0,
                  }}>
                    {entry.text}
                  </p>
                ) : (
                  <p style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
                    color: '#4A6458', margin: 0,
                  }}>
                    [ Collect mirror fragment {i + 1} to unlock this entry ]
                  </p>
                )}
              </div>
            );
          })}

          {fragmentsCollected >= 4 && (
            <>
              <Divider />
              <div style={{
                textAlign: 'center', padding: '16px 0',
                background: 'rgba(255,215,0,0.05)',
                borderRadius: 12,
                border: '1.5px solid rgba(255,215,0,0.2)',
              }}>
                <div style={{
                  fontFamily: 'Anton', fontSize: '1.3rem',
                  color: '#FFD700', letterSpacing: 3, marginBottom: 6,
                }}>
                  THE MIRROR IS WHOLE
                </div>
                <TerminalText>Reality restored. The key fits. The door opens.</TerminalText>
              </div>
            </>
          )}
        </PanelBody>
        <PanelFooter>
          <TerminalText>Fragments are hidden across the world. Explore deeply.</TerminalText>
          <GameButton variant="ghost" onClick={onClose} data-testid="gallery-close-btn">CLOSE</GameButton>
        </PanelFooter>
      </div>
    </div>
  );
};

export default MirrorGallery;
