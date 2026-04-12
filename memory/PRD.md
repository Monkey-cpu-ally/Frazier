# Hyper Axel: Wrenchbound - PRD

## Original Problem Statement
Build a browser-playable 2D action platformer called "Hyper Axel" based on the Godot game "Axel: Wrenchbound". Claymation/stop-motion art style. Full UI system with reusable component library.

## Architecture
- **Frontend**: React 19 + HTML5 Canvas 2D game engine + Game UI Design System
- **Backend**: FastAPI + MongoDB (score persistence/leaderboard)
- **Audio**: Web Audio API synthesized retro SFX
- **Art**: Claymation-style character art (user-provided), AI-generated backgrounds/logo

## Game UI Design System (`/components/gameui/`)
Reusable component library with Scrap-mechanical aesthetic:
- **GamePanel** (container with rivets, accent borders)
- **GameButton** (primary/secondary/ghost, sm/lg/full variants)
- **GameModal** (overlay with backdrop blur)
- **GameSlider** (pipe/bolt aesthetic)
- **GameToggle** (industrial switch)
- **GameBadge** (teal/red/yellow/purple status tags)
- **GameTabs** (tab navigation)
- **GameList/GameListItem** (numbered list with badges)
- **SpeakerBox** (dialogue with typewriter, Scrap/Fox portraits)
- **MeterBar** (progress bars)
- **PowerCard** (power display with icon/color)
- **LeaderboardRow** (ranked score display)
- **KeyCap, Divider, TerminalText** (utility components)

## Screens Implemented
1. **Title Screen** — Logo, character art, PLAY/CONTROLS buttons
2. **Main Menu** — COMMAND TERMINAL with tabs: Play, Levels, Scores, Powers
3. **Level Select** — 5 levels with names, descriptions, OPEN/BOSS badges
4. **Power Inventory** — 6 powers in card grid with colors and descriptions
5. **Leaderboard** — Top 10 scores from backend API
6. **Pause Menu** (ESC) — Resume, Settings, Controls, Restart, Quit to Menu
7. **Settings Panel** — SFX/Music volume, Screen Shake toggle, FPS display, Dialogue auto-play
8. **Controls Overlay** — Full keyboard mapping display with combat tips
9. **Game Over / Victory** — Score display with restart option

## What's Implemented (Jan 2026)
- Full game engine with 5 levels, boss fight, 4 enemy types, 6 powers
- Claymation-style Axel + Scrap character art integrated
- Complete UI flow: Title → Menu → Game → Pause
- Sound effects for all actions
- Reusable Game UI design system
- Backend leaderboard API

## Backlog
### P1
- Dialogue system triggers (level starts, boss encounters)
- Mobile/touch controls
- More levels (6-10)
- Enemy claymation-style art generation

### P2
- Background music
- Save/load progress
- Achievement system
- Cutscene system
