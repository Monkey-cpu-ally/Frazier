# Hyper Axel: Shattered Mirrors - PRD

## Architecture
- Frontend: React 19 + HTML5 Canvas 2D engine + Game UI Design System
- Backend: FastAPI + MongoDB (scores/leaderboard)
- Audio: Web Audio API (SFX + procedural music)
- Art: Claymation style (user-provided Axel/Scrap), AI-generated backgrounds/logo

## Full Flow
Intro Cinematic (8s) → Title Screen → Main Menu → Gameplay → Pause Menu

## Complete Feature List
### Cinematic Intro (SHATTERED MIRRORS)
- 7-phase animated sequence: Void → Fragments → Pull → Mirror → Shatter → Logo → Key Lock
- Synthesized audio: hum, crystal chimes, impacts, shatter, lock sound
- Skippable (any key/click)

### Game UI Design System (/components/gameui/)
15+ reusable components: GamePanel, GameButton, GameModal, GameSlider, GameToggle, GameBadge, GameTabs, GameList, SpeakerBox, MeterBar, PowerCard, LeaderboardRow, KeyCap, Divider, TerminalText

### Screens
1. Title Screen (graffiti logo, claymation Axel, ruins bg)
2. Main Menu (COMMAND TERMINAL: Play/Levels/Scores/Powers/Workshop tabs)
3. Level Select (5 levels, OPEN/BOSS badges)
4. Power Inventory (6 powers in card grid)
5. Leaderboard (top 10 from backend)
6. Scrap's Workshop (8 wrench skins, scrap currency)
7. Pause Menu (ESC: Resume/Settings/Controls/Restart/Quit)
8. Settings Panel (volume sliders, toggles)
9. Controls Overlay (full keyboard + SHIFT dash)
10. Game Over / Victory

### Gameplay (Godot-accurate physics)
- Movement: speed 220, accel 1400, friction 1800
- Jump: force -420, gravity 1200, fall multiplier 1.35, low jump 1.8
- Wall slide (speed 120), wall jump (280x, -360y)
- Dash (SHIFT: speed 520, 0.14s duration, 0.2s cooldown)
- 3-hit wrench combo + air attack + downward smash
- Sticker health (3 stickers, chip damage)
- Scrap meter + 6 powers (15s each)
- 4 enemy types + boss (Rootbound Siege Tank)
- Breakable walls/floors, pickups, Fox Spirit NPC

### Audio
- SFX: all actions synthesized (jump, attack, enemies, pickups, boss, UI)
- Music: procedural exploration/boss/menu tracks (Web Audio API)

### Mobile
- Touch controls overlay (D-pad, jump, attack, power, pause)
- Hidden on desktop, shown on touch devices

## Backlog
- P1: Dialogue triggers, enemy ledge detection, more levels
- P2: Save/load, achievements, cutscenes
