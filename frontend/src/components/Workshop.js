import React, { useState } from 'react';import {
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

// Upgrade tree config (mirrors Godot scrap_damage/malfunction upgrade hooks)
const DAMAGE_TIERS = [
  { level: 1, bonus: 0.05, cost: 30, label: '+5% Strike' },
  { level: 2, bonus: 0.10, cost: 80, label: '+10% Strike' },
  { level: 3, bonus: 0.15, cost: 180, label: '+15% Strike' },
];
const STABILIZER_TIERS = [
  { level: 1, reduction: 0.05, cost: 25, label: '-5% Malfunction' },
  { level: 2, reduction: 0.10, cost: 75, label: '-10% Malfunction' },
  { level: 3, reduction: 0.15, cost: 150, label: '-15% Malfunction' },
];

const Workshop = ({
  open, onClose, scrapParts = 0,
  damageLevel = 0, stabilizerLevel = 0,
  equippedSkin = 'standard',
  unlockedSkins = ['standard'],
  onUpgrade,
  onEquipSkin,
  onUnlockSkin,
}) => {
  const [tab, setTab] = useState('skins');
  const [selected, setSelected] = useState(equippedSkin);
  // Merge persistent unlock set into skin list
  const skins = WRENCH_SKINS.map(s => ({
    ...s,
    unlocked: unlockedSkins.includes(s.id),
  }));

  // Keep selected in sync when equipped changes
  React.useEffect(() => { setSelected(equippedSkin); }, [equippedSkin, open]);

  if (!open) return null;

  const selectedSkin = skins.find(s => s.id === selected);

  const handleUnlockOrEquip = (skin) => {
    if (!skin) return;
    if (skin.unlocked) {
      if (skin.id !== equippedSkin) onEquipSkin && onEquipSkin(skin.id);
    } else {
      if (scrapParts >= skin.cost) onUnlockSkin && onUnlockSkin(skin.id, skin.cost);
    }
  };

  const purchaseUpgrade = (kind, tier) => {
    if (scrapParts < tier.cost) return;
    const curr = kind === 'damage' ? damageLevel : stabilizerLevel;
    if (tier.level !== curr + 1) return; // must buy in order
    onUpgrade && onUpgrade(kind, tier.level, tier.cost);
  };

  const TabBtn = ({ id, label }) => (
    <button
      data-testid={`workshop-tab-${id}`}
      onClick={() => setTab(id)}
      style={{
        background: tab === id ? 'rgba(0,199,190,0.18)' : 'transparent',
        border: `2px solid ${tab === id ? 'var(--gui-accent)' : 'var(--gui-border)'}`,
        color: tab === id ? '#E8F0EC' : '#8AA89A',
        padding: '8px 18px',
        borderRadius: 10,
        fontFamily: 'Fredoka',
        fontWeight: 700,
        fontSize: '0.85rem',
        cursor: 'pointer',
        letterSpacing: 0.5,
      }}
    >{label}</button>
  );

  const UpgradeRow = ({ kind, tiers, current }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
      {tiers.map(t => {
        const owned = t.level <= current;
        const locked = t.level > current + 1;
        const canAfford = scrapParts >= t.cost;
        return (
          <div
            key={t.level}
            data-testid={`upgrade-${kind}-${t.level}`}
            style={{
              padding: 12,
              background: owned ? 'rgba(0,199,190,0.12)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${owned ? 'var(--gui-accent)' : locked ? 'rgba(255,255,255,0.08)' : 'var(--gui-border)'}`,
              borderRadius: 10,
              opacity: locked ? 0.45 : 1,
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'Anton', fontSize: '1.2rem', color: '#FFD60A', marginBottom: 4 }}>
              TIER {t.level}
            </div>
            <div style={{ fontFamily: 'Fredoka', fontSize: '0.8rem', color: '#E8F0EC', marginBottom: 8 }}>
              {t.label}
            </div>
            {owned ? (
              <GameBadge color="teal">OWNED</GameBadge>
            ) : locked ? (
              <GameBadge color="default">LOCKED</GameBadge>
            ) : (
              <GameButton
                variant="secondary"
                full
                disabled={!canAfford}
                onClick={() => purchaseUpgrade(kind, t)}
                data-testid={`upgrade-${kind}-${t.level}-btn`}
              >
                {t.cost} SCRAP
              </GameButton>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="gui-modal-overlay" onClick={onClose} data-testid="workshop-overlay">
      <div className="gui-panel gui-panel--bordered gui-modal gui-modal--wide" onClick={e => e.stopPropagation()}>
        <PanelHeader
          title="SCRAP'S WORKSHOP"
          subtitle="[ Wrench Customization & Assist Upgrades ]"
          right={<GameBadge color="teal">{scrapParts} SCRAP</GameBadge>}
        />

        <div style={{ display: 'flex', gap: 10, padding: '12px 24px 0' }}>
          <TabBtn id="skins" label="WRENCHES" />
          <TabBtn id="upgrades" label="ASSIST UPGRADES" />
        </div>

        <PanelBody>
          {tab === 'skins' && (
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: '0 0 200px', textAlign: 'center' }}>
                <div style={{
                  width: 180, height: 220,
                  background: 'rgba(0,0,0,0.3)', borderRadius: 16,
                  border: '2px solid var(--gui-border)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <svg width="80" height="160" viewBox="0 0 80 160">
                    <rect x="36" y="60" width="8" height="80" rx="2" fill={selectedSkin?.color || '#A0A8B0'} />
                    <rect x="28" y="130" width="24" height="16" rx="3" fill="#D43A2A" />
                    <rect x="20" y="10" width="40" height="55" rx="6" fill={selectedSkin?.color || '#A0A8B0'} />
                    <rect x="28" y="10" width="8" height="20" rx="2" fill="rgba(0,0,0,0.3)" />
                    <rect x="44" y="10" width="8" height="20" rx="2" fill="rgba(0,0,0,0.3)" />
                    <rect x="26" y="8" width="28" height="6" rx="2" fill={selectedSkin?.color || '#A0A8B0'} opacity="0.8" />
                  </svg>
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
                  {selectedSkin?.id === equippedSkin
                    ? <GameBadge color="teal">EQUIPPED</GameBadge>
                    : selectedSkin?.unlocked
                      ? <GameBadge color="yellow">OWNED</GameBadge>
                      : <GameBadge color="yellow">{selectedSkin?.cost} SCRAP</GameBadge>}
                </div>
              </div>

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
                        border: `2px solid ${selected === skin.id ? 'var(--gui-accent)' : skin.id === equippedSkin ? '#FFD60A' : 'var(--gui-border)'}`,
                        borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                        opacity: skin.unlocked ? 1 : 0.5, transition: 'all 0.15s',
                        position: 'relative',
                      }}
                    >
                      {skin.id === equippedSkin && (
                        <div style={{
                          position: 'absolute', top: -6, right: -6,
                          background: '#FFD60A', color: '#0A0A0A',
                          fontSize: '0.55rem', fontWeight: 800,
                          padding: '2px 6px', borderRadius: 6,
                          fontFamily: 'Fredoka',
                        }}>EQUIP</div>
                      )}
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: skin.color, margin: '0 auto 6px',
                        border: '2px solid rgba(255,255,255,0.15)',
                        boxShadow: skin.unlocked ? `0 0 8px ${skin.color}40` : 'none',
                      }} />
                      <div style={{
                        fontFamily: 'Fredoka', fontSize: '0.65rem', fontWeight: 700,
                        color: skin.unlocked ? '#E8F0EC' : '#4A6458',
                      }}>{skin.name}</div>
                      {!skin.unlocked && (
                        <div style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem',
                          color: '#FFD60A', marginTop: 2,
                        }}>{skin.cost} scrap</div>
                      )}
                    </div>
                  ))}
                </div>
                {selectedSkin && !selectedSkin.unlocked && (
                  <div style={{ marginTop: 14 }}>
                    <GameButton
                      variant="secondary" full
                      disabled={scrapParts < selectedSkin.cost}
                      onClick={() => handleUnlockOrEquip(selectedSkin)}
                      data-testid="workshop-unlock-btn"
                    >UNLOCK ({selectedSkin.cost} SCRAP)</GameButton>
                  </div>
                )}
                {selectedSkin && selectedSkin.unlocked && selectedSkin.id !== equippedSkin && (
                  <div style={{ marginTop: 14 }}>
                    <GameButton
                      variant="primary" full
                      onClick={() => handleUnlockOrEquip(selectedSkin)}
                      data-testid="workshop-equip-btn"
                    >EQUIP</GameButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'upgrades' && (
            <div data-testid="workshop-upgrades">
              <TerminalText>[ Strike Damage Core ]</TerminalText>
              <div style={{ fontSize: '0.8rem', color: '#8AA89A', margin: '4px 0 0', fontFamily: 'Nunito' }}>
                Increases Yellow / Orange / Red assist damage percentages.
              </div>
              <UpgradeRow kind="damage" tiers={DAMAGE_TIERS} current={damageLevel} />

              <div style={{ margin: '22px 0 8px' }}><Divider /></div>

              <TerminalText>[ Stabilizer Module ]</TerminalText>
              <div style={{ fontSize: '0.8rem', color: '#8AA89A', margin: '4px 0 0', fontFamily: 'Nunito' }}>
                Reduces Orange assist self-malfunction chance.
              </div>
              <UpgradeRow kind="stabilizer" tiers={STABILIZER_TIERS} current={stabilizerLevel} />
            </div>
          )}
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
