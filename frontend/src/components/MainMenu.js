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
];

const MainMenu = ({ onPlay, onLevelSelect, charUrl, scrapUrl }) => {
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
    { id: 'powers', label: 'Powers' },
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
                      right={<GameBadge color={i < 4 ? 'teal' : 'red'}>{i < 4 ? 'OPEN' : 'BOSS'}</GameBadge>}
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
            {tab === 'powers' && (
              <div>
                <TerminalText>[ Power Database — 6 entries catalogued ]</TerminalText>
                <div className="gui-grid-3" style={{ marginTop: 12 }}>
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
