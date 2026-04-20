import React, { useState, useEffect } from 'react';
import {
  GamePanel, PanelHeader, PanelBody, PanelFooter,
  GameButton, GameTabs, GameList, GameListItem,
  GameBadge, LeaderboardRow, PowerCard, Divider, TerminalText,
} from './gameui';
import { POWERS } from '../game/constants';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

const MainMenu = ({ onPlay, onLevelSelect, onWorkshop, onAchievements, onGallery, charUrl, scrapUrl, progress }) => {
  const [tab, setTab] = useState('play');
  const [scores, setScores] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(0);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/scores/top`)
      .then(r => r.json())
      .then(setScores)
      .catch(() => {});
  }, []);

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
        />

        <PanelBody>
          <GameTabs tabs={tabs} active={tab} onChange={setTab} />

          <div style={{ marginTop: 16, minHeight: 260 }}>
            {/* PLAY TAB */}
            {tab === 'play' && (
              <div className="menu-play-tab">
                <div className="menu-play-hero">
                  <h3 className="menu-play-title">Ready to deploy, Axel?</h3>
                  <TerminalText>Last checkpoint: Level 1 — Overgrown Outskirts</TerminalText>
                </div>
                <Divider />
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
                {scores.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30 }}>
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
