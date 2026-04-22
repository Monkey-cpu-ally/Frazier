import React, { useState, useCallback, useRef } from 'react';
import '@/App.css';
import '@/pixel-theme.css';
import { Toaster, toast } from 'sonner';
import GameCanvas from '@/components/GameCanvas';
import IntroScreen from '@/components/IntroScreen';
import MainMenu from '@/components/MainMenu';
import PauseMenu from '@/components/PauseMenu';
import SettingsPanel from '@/components/SettingsPanel';
import DialogueOverlay from '@/components/DialogueOverlay';
import TouchControls from '@/components/TouchControls';
import Workshop from '@/components/Workshop';
import Achievements from '@/components/Achievements';
import MirrorGallery from '@/components/MirrorGallery';
import WorldPicker from '@/components/WorldPicker';
import EngineStateProbe from '@/components/EngineStateProbe';
import { sfx } from '@/game/sfx';
import { music } from '@/game/music';
// Expose music globally so the canvas-side engine can start/stop the water rush
// without needing a direct import (avoids circular deps with sfx).
if (typeof window !== 'undefined') {
  window.__hyperAxelMusic = music;
}

const ACHIEVEMENT_NAMES = {
  first_blood: 'First Blood',
  combo_master: 'Combo Master',
  coin_collector: 'Coin Collector',
  scrap_hoarder: 'Scrap Hoarder',
  power_user: 'Power User',
  wall_jumper: 'Wall Jumper',
  dasher: 'Dasher',
  boss_slayer: 'Boss Slayer',
  fragment_1: 'First Fragment',
  fragment_all: 'All Fragments',
  no_damage_level: 'Untouchable',
  speed_run: 'Speed Runner',
  explorer: 'Explorer',
  all_levels: 'Full Circuit',
  high_score: 'High Score',
};

const BG_URL = 'https://static.prod-images.emergentagent.com/jobs/373297d6-1933-47c6-98ac-bd4bef2c6b43/images/e352993c8b6ad491a1f19da7bb7f3a7aa5ade71deb48994a814b5024daf01114.png';
const CHAR_URL = 'https://customer-assets.emergentagent.com/job_agent-platform-73/artifacts/3vnrayz5_download%20%282%29.jpeg';
const LOGO_URL = 'https://static.prod-images.emergentagent.com/jobs/373297d6-1933-47c6-98ac-bd4bef2c6b43/images/b9f1e61660d975d35abd57e13d38465e838517983dcb816893171db757fb203e.png';
const SCRAP_URL = 'https://customer-assets.emergentagent.com/job_agent-platform-73/artifacts/65k5qqhf_file_00000000b57c71fbb0f6cfcc4204d795.png';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_SETTINGS = {
  sfxVolume: 35,
  musicVolume: 50,
  screenShake: true,
  showFps: false,
  dialogueAuto: false,
};

function App() {
  // Screen states: intro -> title -> menu -> playing
  const [screen, setScreen] = useState('intro');
  const [playerName, setPlayerName] = useState(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem('hyperaxel_player_name')) || '';
    return saved.trim().slice(0, 24);
  });
  const playerId = playerName.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'default';
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkshop, setShowWorkshop] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [startLevel, setStartLevel] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const [isMobile] = useState(() => 'ontouchstart' in window);
  const [progress, setProgress] = useState({
    levels_completed: [], mirror_fragments: 0, achievements: [],
    total_coins: 0, total_scrap: 0, high_score: 0,
    wrench_skin: 'standard', unlocked_skins: ['standard'],
    assist_damage_level: 0, assist_stabilizer_level: 0,
    best_run_time_ms: 0, best_l1_time_ms: 0,
  });
  const [speedrunMode, setSpeedrunMode] = useState(false);
  const [dailyMode, setDailyMode] = useState(false);
  const [dailyModifier, setDailyModifier] = useState(null);
  const [hubMode, setHubMode] = useState(false);
  const [showWorldPicker, setShowWorldPicker] = useState(false);
  const [biomeChoice, setBiomeChoice] = useState(null);

  // Fetch daily modifier on mount
  React.useEffect(() => {
    fetch(`${BACKEND_URL}/api/daily-challenge`)
      .then(r => r.json())
      .then(d => setDailyModifier(d.modifier))
      .catch(() => {});
  }, []);
  const engineRef = useRef(null);

  // Load progress on mount
  React.useEffect(() => {
    fetch(`${BACKEND_URL}/api/progress/${playerId}`)
      .then(r => r.json())
      .then(data => setProgress(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, [playerId]);

  // Apply settings
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
    sfx.volume = newSettings.sfxVolume / 100;
    sfx.enabled = newSettings.sfxVolume > 0;
    music.setVolume(newSettings.musicVolume / 200);
    music.enabled = newSettings.musicVolume > 0;
    if (engineRef.current) {
      engineRef.current.camera && (engineRef.current.camera.shakeEnabled = newSettings.screenShake);
    }
  }, []);

  const handleGameState = useCallback((state) => {
    // Game engine state changes
  }, []);

  const handleUpgrade = useCallback(async (kind, level, cost) => {
    // Validate and spend scrap, bump level, persist
    setProgress(prev => {
      if (prev.total_scrap < cost) return prev;
      const field = kind === 'damage' ? 'assist_damage_level' : 'assist_stabilizer_level';
      if (level !== (prev[field] || 0) + 1) return prev;
      const next = { ...prev, total_scrap: prev.total_scrap - cost, [field]: level };
      fetch(`${BACKEND_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...next, player_id: playerId }),
      }).catch(() => {});
      sfx.uiStart();
      return next;
    });
  }, []);

  const handleScrapEarned = useCallback((earned, finalScore, finalCoins) => {
    setProgress(prev => {
      const next = {
        ...prev,
        total_scrap: (prev.total_scrap || 0) + earned,
        total_coins: (prev.total_coins || 0) + (finalCoins || 0),
        high_score: Math.max(prev.high_score || 0, finalScore || 0),
      };
      fetch(`${BACKEND_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...next, player_id: playerId }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const handleAchievement = useCallback((id) => {
    setProgress(prev => {
      if ((prev.achievements || []).includes(id)) return prev;
      const next = { ...prev, achievements: [...(prev.achievements || []), id] };
      fetch(`${BACKEND_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...next, player_id: playerId }),
      }).catch(() => {});
      return next;
    });
    toast.success(`🏆 ${ACHIEVEMENT_NAMES[id] || id}`, {
      description: 'Achievement unlocked',
      duration: 3600,
      style: {
        background: 'rgba(12, 18, 24, 0.95)',
        border: '2px solid #FFD60A',
        color: '#FFD60A',
        fontFamily: 'Fredoka, sans-serif',
      },
    });
    sfx.uiStart();
  }, []);

  const handleRunComplete = useCallback(({ finalMs, level1Ms }) => {
    setProgress(prev => {
      const next = {
        ...prev,
        best_run_time_ms: prev.best_run_time_ms && prev.best_run_time_ms < finalMs
          ? prev.best_run_time_ms
          : Math.floor(finalMs || 0),
        best_l1_time_ms: prev.best_l1_time_ms && level1Ms && prev.best_l1_time_ms < level1Ms
          ? prev.best_l1_time_ms
          : (level1Ms ? Math.floor(level1Ms) : prev.best_l1_time_ms),
      };
      fetch(`${BACKEND_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...next, player_id: playerId }),
      }).catch(() => {});
      return next;
    });
    // Submit speedrun leaderboard entry if speedrun mode was on
    if (speedrunMode && finalMs > 0) {
      const name = (window.localStorage.getItem('hyperaxel_player_name') || '').trim() || 'Axel';
      fetch(`${BACKEND_URL}/api/leaderboard/speedrun`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: name,
          total_ms: Math.floor(finalMs),
          l1_ms: Math.floor(level1Ms || 0),
        }),
      }).catch(() => {});
    }
    // Record daily challenge completion if daily was on
    if (dailyMode && finalMs > 0) {
      const today = new Date().toISOString().slice(0, 10);
      fetch(`${BACKEND_URL}/api/daily-challenge/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          date: today,
          total_ms: Math.floor(finalMs),
        }),
      }).catch(() => {});
      toast.success('🎯 Daily Challenge cleared!', {
        duration: 4000,
        style: {
          background: 'rgba(12,18,24,0.95)',
          border: '2px solid #FF9F43',
          color: '#FF9F43',
          fontFamily: 'Fredoka, sans-serif',
        },
      });
    }
  }, [speedrunMode, dailyMode]);

  const handlePlayDaily = useCallback(() => {
    setDailyMode(true);
    setSpeedrunMode(true); // daily implies speedrun tracking
    setStartLevel(0);
    setHubMode(false);
    setRestartKey(k => k + 1);
    setScreen('playing');
    sfx.uiStart();
  }, []);

  const handleGoToHub = useCallback(() => {
    setHubMode(true);
    setDailyMode(false);
    setSpeedrunMode(false);
    setRestartKey(k => k + 1);
    setScreen('playing');
    sfx.uiStart();
  }, []);

  const handleHubInteract = useCallback((kind) => {
    if (kind === 'shop' || kind === 'upgrade_station') {
      // If WorldPicker is already open (player walked through kiosks with E held),
      // don't stack a second modal — prefer the destination they already opened.
      if (showWorldPicker) return;
      setShowWorkshop(true);
      sfx.uiClick();
    } else if (kind === 'mission_gate') {
      // MISSION wins over a stuck Workshop if player keeps holding E into it.
      setShowWorkshop(false);
      setShowWorldPicker(true);
      sfx.uiClick();
    }
  }, [showWorldPicker]);

  const handleChooseWorld = useCallback((worldId) => {
    setShowWorldPicker(false);
    sfx.uiStart();
    if (worldId === 'story') {
      setHubMode(false);
      setBiomeChoice(null);
      setStartLevel(0);
      setRestartKey(k => k + 1);
      return;
    }
    // Biome deployment — set biomeChoice, leave hub mode
    setHubMode(false);
    setBiomeChoice(worldId);
    setRestartKey(k => k + 1);
  }, []);

  const handleEquipSkin = useCallback((skinId) => {
    setProgress(prev => {
      if (!(prev.unlocked_skins || []).includes(skinId)) return prev;
      const next = { ...prev, wrench_skin: skinId };
      fetch(`${BACKEND_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...next, player_id: playerId }),
      }).catch(() => {});
      return next;
    });
    sfx.uiClick();
  }, []);

  const handleUnlockSkin = useCallback((skinId, cost) => {
    setProgress(prev => {
      if ((prev.unlocked_skins || []).includes(skinId)) return prev;
      if ((prev.total_scrap || 0) < cost) return prev;
      const next = {
        ...prev,
        total_scrap: prev.total_scrap - cost,
        unlocked_skins: [...(prev.unlocked_skins || []), skinId],
        wrench_skin: skinId,
      };
      fetch(`${BACKEND_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...next, player_id: playerId }),
      }).catch(() => {});
      return next;
    });
    sfx.uiStart();
  }, []);

  const goToMenu = () => {
    sfx.uiClick();
    music.stop();
    music.playMenu();
    setScreen('menu');
  };

  const startGame = (levelIndex = 0) => {
    sfx.uiStart();
    music.stop();
    music.playExploration();
    setStartLevel(levelIndex);
    setDailyMode(false); // regular play — not a daily run
    setScreen('playing');
    setPaused(false);
  };

  const handlePause = useCallback(() => {
    setPaused(p => !p);
    sfx.uiClick();
  }, []);

  const handleQuitToMenu = () => {
    setPaused(false);
    setScreen('menu');
    sfx.uiClick();
  };

  const handleRestart = () => {
    setPaused(false);
    sfx.uiClick();
    // Force-remount GameCanvas via key bump to fully reinit engine
    setRestartKey(k => k + 1);
  };

  // Global ESC handler: close overlays first, then pause game
  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.code !== 'Escape') return;
      if (showControls) { setShowControls(false); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (showWorkshop) { setShowWorkshop(false); return; }
      if (showAchievements) { setShowAchievements(false); return; }
      if (showGallery) { setShowGallery(false); return; }
      if (screen === 'playing') {
        handlePause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen, handlePause, showControls, showSettings, showWorkshop, showAchievements, showGallery]);

  // Play the title "glimpse" theme on the title screen. Browsers block autoplay
  // until the user interacts, so we hook a one-shot pointerdown/keydown starter.
  // Also fires two title SFX: a glass shatter (evokes "SHATTERED MIRRORS") and
  // a warm ascending glimpse shimmer.
  React.useEffect(() => {
    if (screen !== 'title') return;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      try {
        sfx.shatter();
        setTimeout(() => { try { sfx.glimpse(); } catch (e) {} }, 380);
        setTimeout(() => { try { music.playTitle(); } catch (e) {} }, 900);
      } catch (e) {}
    };
    // Try immediately — some browsers allow it after intro cinematic.
    start();
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      if (screen !== 'title') music.stop();
    };
  }, [screen]);

  return (
    <div className="app-root" data-testid="app-root">
      <Toaster position="top-right" richColors theme="dark" />
      <div className="game-wrapper" data-testid="game-wrapper">

        {/* ===== INTRO CINEMATIC ===== */}
        {screen === 'intro' && (
          <IntroScreen onComplete={() => setScreen('title')} />
        )}

        {/* ===== TITLE SCREEN ===== */}
        {screen === 'title' && (
          <div className="title-screen" data-testid="title-screen">
            <div className="title-bg" style={{ backgroundImage: `url(${BG_URL})` }}>
              <div className="title-overlay" />
              <div className="title-content title-content-centered">
                <div className="title-center">
                  {/* Pixel-art logo — inline SVG so it's crisp at any size. */}
                  <svg
                    className="title-logo-pixel"
                    data-testid="title-logo-pixel"
                    viewBox="0 0 560 260"
                    xmlns="http://www.w3.org/2000/svg"
                    shapeRendering="crispEdges"
                  >
                    {/* HYPER — top row, red/yellow layered bevel */}
                    <text x="88" y="88"  fontFamily="'Press Start 2P', monospace" fontSize="64" fill="#141014">HYPER</text>
                    <text x="80" y="80"  fontFamily="'Press Start 2P', monospace" fontSize="64" fill="#E23A2E">HYPER</text>
                    <text x="78" y="76"  fontFamily="'Press Start 2P', monospace" fontSize="64" fill="#FFD34D">HYPER</text>
                    {/* AXEL — second row, larger yellow bevel */}
                    <text x="108" y="188" fontFamily="'Press Start 2P', monospace" fontSize="84" fill="#141014">AXEL</text>
                    <text x="100" y="180" fontFamily="'Press Start 2P', monospace" fontSize="84" fill="#A36F00">AXEL</text>
                    <text x="98"  y="176" fontFamily="'Press Start 2P', monospace" fontSize="84" fill="#FFD34D">AXEL</text>
                    {/* Subtitle chip */}
                    <rect x="140" y="210" width="280" height="30" fill="#141014" />
                    <rect x="144" y="214" width="272" height="22" fill="#2DA232" />
                    <text x="164" y="232" fontFamily="'Press Start 2P', monospace" fontSize="14" fill="#141014">
                      SHATTERED MIRRORS
                    </text>
                  </svg>

                  <div className="title-buttons title-buttons-centered">
                    <button
                      className="start-btn"
                      data-testid="start-game-button"
                      onClick={goToMenu}
                    >
                      PLAY
                    </button>
                    <button
                      className="controls-btn"
                      data-testid="controls-button"
                      onClick={() => setShowControls(true)}
                    >
                      CONTROLS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MAIN MENU ===== */}
        {screen === 'menu' && (
          <div className="menu-screen" data-testid="menu-screen" style={{ backgroundImage: `url(${BG_URL})` }}>
            <div className="menu-overlay" />
            <div className="menu-content">
              <MainMenu
                onPlay={startGame}
                onLevelSelect={startGame}
                onWorkshop={() => setShowWorkshop(true)}
                onAchievements={() => setShowAchievements(true)}
                onGallery={() => setShowGallery(true)}
                charUrl={CHAR_URL}
                scrapUrl={SCRAP_URL}
                progress={progress}
                speedrunMode={speedrunMode}
                onToggleSpeedrun={setSpeedrunMode}
                dailyMode={dailyMode}
                onToggleDaily={setDailyMode}
                dailyModifier={dailyModifier}
                onPlayDaily={handlePlayDaily}
                onGoToHub={handleGoToHub}
                playerName={playerName}
                playerId={playerId}
                onSetPlayerName={(name) => {
                  const trimmed = (name || '').trim().slice(0, 24);
                  setPlayerName(trimmed);
                  try { window.localStorage.setItem('hyperaxel_player_name', trimmed); } catch (e) {}
                }}
              />
            </div>
          </div>
        )}

        {/* ===== GAME SCREEN ===== */}
        {(screen === 'playing') && (
          <div className="game-screen" data-testid="game-screen">
            <GameCanvas
              key={restartKey}
              onStateChange={handleGameState}
              onScrapEarned={handleScrapEarned}
              onAchievement={handleAchievement}
              onRunComplete={handleRunComplete}
              onHubInteract={handleHubInteract}
              startLevel={startLevel}
              paused={paused}
              hubMode={hubMode}
              biomeChoice={biomeChoice}
              settings={settings}
              assistDamageLevel={progress.assist_damage_level || 0}
              assistStabilizerLevel={progress.assist_stabilizer_level || 0}
              equippedSkin={progress.wrench_skin || 'standard'}
              speedrunMode={speedrunMode}
              dailyMode={dailyMode}
              dailyModifier={dailyModifier}
              persistentTotalCoins={progress.total_coins || 0}
              persistentTotalScrap={progress.total_scrap || 0}
              unlockedAchievements={progress.achievements || []}
              ref={engineRef}
            />
            <EngineStateProbe engineRef={engineRef} />

            {/* Pause Menu Overlay */}
            {paused && (
              <PauseMenu
                onResume={handlePause}
                onRestart={handleRestart}
                onSettings={() => setShowSettings(true)}
                onControls={() => setShowControls(true)}
                onQuit={handleQuitToMenu}
              />
            )}

            {/* Touch Controls for mobile */}
            <TouchControls visible={isMobile && !paused} />
          </div>
        )}

        {/* ===== WORKSHOP ===== */}
        <Workshop
          open={showWorkshop}
          onClose={() => setShowWorkshop(false)}
          scrapParts={progress.total_scrap}
          damageLevel={progress.assist_damage_level || 0}
          stabilizerLevel={progress.assist_stabilizer_level || 0}
          equippedSkin={progress.wrench_skin || 'standard'}
          unlockedSkins={progress.unlocked_skins || ['standard']}
          onUpgrade={handleUpgrade}
          onEquipSkin={handleEquipSkin}
          onUnlockSkin={handleUnlockSkin}
        />

        {/* ===== WORLD PICKER ===== */}
        <WorldPicker
          open={showWorldPicker}
          onClose={() => setShowWorldPicker(false)}
          onChoose={handleChooseWorld}
        />

        {/* ===== ACHIEVEMENTS ===== */}
        <Achievements
          open={showAchievements}
          onClose={() => setShowAchievements(false)}
          unlockedIds={progress.achievements}
        />

        {/* ===== MIRROR GALLERY ===== */}
        <MirrorGallery
          open={showGallery}
          onClose={() => setShowGallery(false)}
          fragmentsCollected={progress.mirror_fragments}
        />

        {/* ===== SETTINGS MODAL ===== */}
        <SettingsPanel
          open={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />

        {/* ===== CONTROLS OVERLAY ===== */}
        {showControls && (
          <div className="controls-overlay" data-testid="controls-overlay" onClick={() => setShowControls(false)}>
            <div className="controls-panel" onClick={(e) => e.stopPropagation()}>
              <h2 className="controls-title">CONTROLS</h2>
              <div className="controls-grid">
                <ControlRow keys={['A', 'D']} action="Move Left / Right" />
                <ControlRow keys={['SPACE']} action="Jump" />
                <ControlRow keys={['X', 'J']} action="Swing Wrench" />
                <ControlRow keys={['S', '+', 'X']} action="Downward Smash (in air)" />
                <ControlRow keys={['SHIFT']} action="Dash" />
                <ControlRow keys={['Q']} action="Scrap Assist (call-in)" />
                <ControlRow keys={['K', 'Z']} action="Special / Use Power" />
                <ControlRow keys={['E']} action="Interact (Fox Statue)" />
                <ControlRow keys={['TAB']} action="Flight Log" />
                <ControlRow keys={['ESC']} action="Pause" />
              </div>
              <div className="controls-tips">
                <h3>Combat Tips</h3>
                <ul>
                  <li>Chain 3 ground attacks for a wrench combo</li>
                  <li>Use downward smash to break cracked floors</li>
                  <li>Collect power orbs for 15-second abilities</li>
                  <li>Burning Buffalo lets you charge through walls</li>
                  <li>Heavy enemies need Golden Gloves or Burning Buffalo to damage</li>
                  <li>Flicker enemies are only vulnerable when blinking open</li>
                  <li>Scrap meter powers call-ins: Green (heal) → Yellow → Orange → Red (airstrike)</li>
                  <li>Hit the boss during its vulnerable phase</li>
                </ul>
              </div>
              <button
                className="close-btn"
                data-testid="close-controls-button"
                onClick={() => setShowControls(false)}
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlRow({ keys, action }) {
  return (
    <div className="control-row">
      <div className="key-group">
        {keys.map((k, i) => (
          <React.Fragment key={i}>
            {k === '+' ? <span style={{ color: 'rgba(255,255,255,0.3)' }}>+</span> : <kbd>{k}</kbd>}
          </React.Fragment>
        ))}
      </div>
      <span>{action}</span>
    </div>
  );
}

export default App;
