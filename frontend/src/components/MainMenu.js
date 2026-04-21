import React, { useState, useEffect } from 'react';
import {
  GamePanel, PanelHeader, PanelBody, PanelFooter,
  GameButton, GameTabs, GameList, GameListItem,
  GameBadge, LeaderboardRow, PowerCard, Divider, TerminalText,
} from './gameui';
import { POWERS } from '../game/constants';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function formatMs(ms) {
  const total = Math.floor(ms);
  const mins = Math.floor(total / 60000);
  const secs = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

const LEVELS = [
  { name: 'Overgrown Outskirts', sub: 'Intro platforming + coins', enemies: 'Root Crawlers' },
  { name: 'Rust Climb', sub: 'Vertical traverse + mixed enemies', enemies: 'Crawlers, Gear Bugs' },
  { name: 'Hidden Depths', sub: 'Breakable floor puzzle', enemies: 'Flicker, Crawlers' },
  { name: 'Buffalo Gate', sub: 'Power + wall interaction', enemies: 'Gear Bugs, Crawlers' },
  { name: 'Siege Core', sub: 'Boss arena', enemies: 'ALL + Siege Tank' },
  { name: "Scrap's Workshop", sub: 'Old base exploration', enemies: 'Gear Bugs, Heavy, Flicker' },
  { name: 'Canopy Run', sub: 'Treetop platforming', enemies: 'Flicker, Crawlers, Gear Bugs' },
  { name: 'Pipe Network', sub: 'Wall jump challenge', enemies: 'ALL types' },
  { name: 'Mirror Vault', sub: 'Crystal realm', enemies: 'Flicker swarm, Heavy' },
  { name: 'Shattered Core', sub: 'Final gauntlet', enemies: 'EVERYTHING' },
];

const MainMenu = ({
  onPlay, onLevelSelect, onWorkshop, onAchievements, onGallery,
  charUrl, scrapUrl, progress,
  speedrunMode = false, onToggleSpeedrun,
  dailyMode = false, onToggleDaily,
  dailyModifier = null,
  onPlayDaily,
  playerName = '', playerId = 'default', onSetPlayerName,
}) => {
  const [tab, setTab] = useState('play');
  const [scores, setScores] = useState([]);
  const [speedrunBoard, setSpeedrunBoard] = useState([]);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [nameInput, setNameInput] = useState(playerName);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/scores/top`)
      .then(r => r.json()).then(setScores).catch(() => {});
    fetch(`${BACKEND_URL}/api/leaderboard/speedrun?limit=10`)
      .then(r => r.json()).then(setSpeedrunBoard).catch(() => {});
    fetch(`${BACKEND_URL}/api/daily-challenge/completed/${playerId}`)
      .then(r => r.json()).then(d => setDailyCompleted(!!d.completed)).catch(() => {});
    fetch(`${BACKEND_URL}/api/daily-challenge/streak/${playerId}`)
      .then(r => r.json()).then(d => setDailyStreak(d.streak || 0)).catch(() => {});
  }, [playerId]);

  useEffect(() => { setNameInput(playerName); }, [playerName]);

  const commitName = () => {
    const clean = (nameInput || '').trim();
    if (clean && onSetPlayerName) onSetPlayerName(clean);
  };

  const tabs = [
    { id: 'play', label: 'Play' },
    { id: 'levels', label: 'Levels' },
    { id: 'board', label: 'Scores' },
    { id: 'more', label: 'More' },
  ];

  return (
    <div className="main-menu-wrap" data-testid="main-menu">
      {/* Character portraits */}
      <div className="menu-portraits">
        <img src={charUrl} alt="Axel" className="menu-portrait-axel" data-testid="menu-axel-portrait" />
        <img src={scrapUrl} alt="Scrap" className="menu-portrait-scrap" data-testid="menu-scrap-portrait" />
      </div>

      <GamePanel variant="bordered" className="menu-panel">
        <PanelHeader
          title="COMMAND TERMINAL"
          subtitle="[ Scrap OS v1.2 — All Systems Nominal ]"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#8AA89A' }}>PILOT:</span>
              <input
                data-testid="player-name-input"
                value={nameInput}
                onChange={e => setNameInput(e.target.value.slice(0, 24))}
                onBlur={commitName}
                onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
                placeholder="Axel"
                style={{
                  background: 'rgba(0,0,0,0.45)',
                  border: '2px solid var(--gui-border)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  color: '#E8F0EC',
                  fontFamily: 'Fredoka',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  width: 140,
                  outline: 'none',
                }}
                maxLength={24}
              />
            </div>
          }
        />

        <PanelBody>
          <GameTabs tabs={tabs} active={tab} onChange={setTab} />

          <div style={{ marginTop: 16, minHeight: 260 }}>
            {/* PLAY TAB */}
            {tab === 'play' && (
              <div className="menu-play-tab">
                {/* Premium Pilot Status Hero */}
                <div
                  className="pilot-status-hero"
                  data-testid="pilot-status-hero"
                  style={{
                    position: 'relative',
                    padding: '18px 22px',
                    background: 'linear-gradient(135deg, rgba(10,22,28,0.95) 0%, rgba(18,38,48,0.85) 100%)',
                    border: '2px solid rgba(0,199,190,0.3)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    marginBottom: 18,
                  }}
                >
                  {/* Scanline overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(127,255,232,0.025) 0px, rgba(127,255,232,0.025) 1px, transparent 1px, transparent 3px)',
                    pointerEvents: 'none',
                  }} />
                  {/* Corner brackets */}
                  {[['tl', 'top-left'], ['tr', 'top-right'], ['bl', 'bottom-left'], ['br', 'bottom-right']].map(([id]) => (
                    <div key={id} style={{
                      position: 'absolute',
                      width: 14, height: 14,
                      borderColor: 'var(--gui-accent)',
                      borderStyle: 'solid',
                      borderWidth: 0,
                      ...(id === 'tl' && { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 }),
                      ...(id === 'tr' && { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 }),
                      ...(id === 'bl' && { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 }),
                      ...(id === 'br' && { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2 }),
                    }} />
                  ))}

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      display: 'flex', alignItems: 'baseline', gap: 10,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.68rem', color: '#00C7BE', letterSpacing: 2, marginBottom: 6,
                    }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#7FE08A', boxShadow: '0 0 8px #7FE08A' }} />
                      PILOT STATUS · ONLINE
                    </div>
                    <h3 style={{
                      fontFamily: 'Anton, sans-serif',
                      fontSize: '1.9rem', letterSpacing: 1,
                      color: '#E8F0EC',
                      margin: '2px 0 4px',
                      textTransform: 'uppercase',
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    }}>
                      Ready to deploy, {playerName || 'Axel'}
                    </h3>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 10, marginTop: 12,
                    }}>
                      {[
                        { label: 'COINS', value: progress?.total_coins || 0, color: '#FFD60A' },
                        { label: 'SCRAP', value: progress?.total_scrap || 0, color: '#00C7BE' },
                        { label: 'MIRRORS', value: `${progress?.mirror_fragments || 0}/4`, color: '#AADDFF' },
                        { label: 'HI-SCORE', value: progress?.high_score || 0, color: '#FF9F43' },
                      ].map(s => (
                        <div key={s.label} style={{
                          padding: '6px 8px',
                          background: 'rgba(0,0,0,0.35)',
                          borderLeft: `2px solid ${s.color}`,
                          borderRadius: 4,
                        }}>
                          <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.58rem', color: '#8AA89A', letterSpacing: 1.2,
                          }}>{s.label}</div>
                          <div style={{
                            fontFamily: 'Anton', fontSize: '1.15rem',
                            color: s.color, lineHeight: 1.1,
                            textShadow: `0 0 12px ${s.color}40`,
                          }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      marginTop: 12,
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.72rem', color: '#8AA89A',
                    }}>
                      <span>▸ Last checkpoint: <span style={{ color: '#E8F0EC' }}>Overgrown Outskirts</span></span>
                      {progress?.best_run_time_ms > 0 && (
                        <span>BEST: <span style={{ color: '#FFD60A' }}>{formatMs(progress.best_run_time_ms)}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                <GameButton
                  variant="primary"
                  size="lg"
                  full
                  onClick={() => onPlay(0)}
                  data-testid="menu-start-btn"
                >
                  START MISSION
                </GameButton>
                <div style={{ marginTop: 10 }}>
                  <GameButton variant="ghost" full onClick={() => setTab('levels')}>
                    SELECT LEVEL
                  </GameButton>
                </div>
                {/* Speedrun Mode toggle */}
                <div
                  onClick={() => onToggleSpeedrun && onToggleSpeedrun(!speedrunMode)}
                  data-testid="menu-speedrun-toggle"
                  style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    background: speedrunMode ? 'rgba(255,214,10,0.14)' : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${speedrunMode ? '#FFD60A' : 'var(--gui-border)'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'Fredoka', fontWeight: 700, color: speedrunMode ? '#FFD60A' : '#E8F0EC', fontSize: '0.9rem' }}>
                      SPEEDRUN MODE
                    </div>
                    <div style={{ fontFamily: 'Nunito', fontSize: '0.7rem', color: '#8AA89A', marginTop: 2 }}>
                      Show live timer • track personal best
                    </div>
                  </div>
                  <div style={{
                    width: 38, height: 22, borderRadius: 11,
                    background: speedrunMode ? '#FFD60A' : 'rgba(255,255,255,0.15)',
                    position: 'relative', transition: 'background 0.15s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 2,
                      left: speedrunMode ? 18 : 2,
                      width: 18, height: 18, borderRadius: '50%',
                      background: speedrunMode ? '#0A0A0A' : '#8AA89A',
                      transition: 'left 0.15s',
                    }} />
                  </div>
                </div>
                {progress && progress.best_run_time_ms > 0 && (
                  <div style={{ textAlign: 'center', marginTop: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#FFD60A' }}>
                    Best run: {formatMs(progress.best_run_time_ms)}
                    {progress.best_l1_time_ms > 0 && <span style={{ marginLeft: 10 }}>• L1: {formatMs(progress.best_l1_time_ms)}</span>}
                  </div>
                )}

                {/* Daily Challenge Card */}
                {dailyModifier && (
                  <div
                    data-testid="daily-challenge-card"
                    style={{
                      marginTop: 14,
                      padding: 14,
                      background: dailyCompleted ? 'rgba(127,224,138,0.10)' : 'rgba(255,159,67,0.10)',
                      border: `2px solid ${dailyCompleted ? '#7FE08A' : '#FF9F43'}`,
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontFamily: 'Anton', fontSize: '0.75rem', color: '#FF9F43', letterSpacing: 2 }}>
                        DAILY CHALLENGE
                      </div>
                      {dailyCompleted && (
                        <div style={{ fontFamily: 'Fredoka', fontWeight: 800, color: '#7FE08A', fontSize: '0.7rem' }}>✓ CLEARED TODAY</div>
                      )}
                    </div>
                    <div style={{ fontFamily: 'Fredoka', fontWeight: 800, color: '#E8F0EC', fontSize: '1.1rem' }}>
                      {dailyModifier.name}
                    </div>
                    <div style={{ fontFamily: 'Nunito', fontSize: '0.8rem', color: '#C5D5CC', marginTop: 2 }}>
                      {dailyModifier.desc}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <GameButton
                        variant={dailyCompleted ? 'ghost' : 'secondary'}
                        full
                        onClick={() => onPlayDaily && onPlayDaily()}
                        data-testid="play-daily-btn"
                      >
                        {dailyCompleted ? 'REPLAY CHALLENGE' : 'PLAY CHALLENGE'}
                      </GameButton>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LEVELS TAB */}
            {tab === 'levels' && (
              <div>
                <GameList>
                  {LEVELS.map((lv, i) => (
                    <GameListItem
                      key={i}
                      num={i + 1}
                      title={lv.name}
                      subtitle={`${lv.sub} — ${lv.enemies}`}
                      active={selectedLevel === i}
                      onClick={() => setSelectedLevel(i)}
                      right={<GameBadge color={i === 4 ? 'red' : (lv.name.includes('Mirror') || lv.name.includes('Shattered') ? 'purple' : 'teal')}>{i === 4 ? 'BOSS' : (i >= 5 ? 'NEW' : 'OPEN')}</GameBadge>}
                      testId={`level-select-${i}`}
                    />
                  ))}
                </GameList>
                <div style={{ marginTop: 14 }}>
                  <GameButton
                    variant="secondary"
                    full
                    onClick={() => onLevelSelect(selectedLevel)}
                    data-testid="menu-play-level-btn"
                  >
                    DEPLOY TO LEVEL {selectedLevel + 1}
                  </GameButton>
                </div>
              </div>
            )}

            {/* LEADERBOARD TAB */}
            {tab === 'board' && (
              <div>
                <TerminalText>[ Top Scores ]</TerminalText>
                <div style={{ marginBottom: 18 }}>
                  {scores.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <TerminalText>No scores recorded yet. Go play!</TerminalText>
                    </div>
                  ) : (
                    scores.map((s, i) => (
                      <LeaderboardRow
                        key={i}
                        rank={i + 1}
                        score={s.score}
                        coins={s.coins}
                        level={s.level}
                      />
                    ))
                  )}
                </div>
                <Divider />
                <TerminalText>[ Speedrun Leaderboard ]</TerminalText>
                <div data-testid="speedrun-leaderboard" style={{ marginTop: 10 }}>
                  {speedrunBoard.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <TerminalText>Finish a run in Speedrun Mode to appear here.</TerminalText>
                    </div>
                  ) : (
                    speedrunBoard.map((e, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 12px',
                        background: i === 0 ? 'rgba(255,214,10,0.12)' : 'rgba(255,255,255,0.02)',
                        border: `2px solid ${i === 0 ? '#FFD60A' : 'var(--gui-border)'}`,
                        borderRadius: 8, marginBottom: 6,
                      }}>
                        <div style={{ fontFamily: 'Anton', fontSize: '1.2rem', color: i === 0 ? '#FFD60A' : '#E8F0EC', width: 32 }}>#{i + 1}</div>
                        <div style={{ flex: 1, fontFamily: 'Fredoka', fontWeight: 700, color: '#E8F0EC' }}>{e.player_name}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FFD60A' }}>{formatMs(e.total_ms)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* POWERS TAB */}
            {tab === 'more' && (
              <div>
                <TerminalText>[ Systems & Collections ]</TerminalText>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  <GameButton variant="ghost" full onClick={() => setTab('powers')} data-testid="menu-powers-btn">
                    POWER DATABASE ({Object.keys(POWERS).length} ENTRIES)
                  </GameButton>
                  <GameButton variant="ghost" full onClick={onWorkshop} data-testid="open-workshop-btn">
                    SCRAP'S WORKSHOP
                  </GameButton>
                  <GameButton variant="ghost" full onClick={onAchievements} data-testid="menu-achievements-btn">
                    ACHIEVEMENTS ({progress?.achievements?.length || 0} UNLOCKED)
                  </GameButton>
                  <GameButton variant="ghost" full onClick={onGallery} data-testid="menu-gallery-btn">
                    MIRROR GALLERY ({progress?.mirror_fragments || 0}/4 FRAGMENTS)
                  </GameButton>
                </div>
              </div>
            )}

            {/* POWERS SUB-TAB */}
            {tab === 'powers' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <GameButton variant="ghost" size="sm" onClick={() => setTab('more')}>BACK</GameButton>
                  <TerminalText>[ Power Database — 6 entries ]</TerminalText>
                </div>
                <div className="gui-grid-3">
                  {Object.entries(POWERS).map(([id, p]) => (
                    <PowerCard
                      key={id}
                      name={p.name}
                      letter={p.letter}
                      color={p.color}
                      desc={`${p.dur}s duration`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </PanelBody>
      </GamePanel>
    </div>
  );
};

export default MainMenu;
