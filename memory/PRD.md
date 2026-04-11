# Hyper Axel: Wrenchbound - PRD

## Original Problem Statement
Build a browser-playable 2D action platformer called "Hyper Axel" based on the Godot game "Axel: Wrenchbound". The game features Axel, a black/brown girl mechanic with a red cap and wrench weapon, navigating overgrown urban-mechanical ruins with SMW2/Metal Slug-inspired design language.

## Architecture
- **Frontend**: React 19 + HTML5 Canvas game engine (custom)
- **Backend**: FastAPI + MongoDB (score persistence)
- **Rendering**: Canvas 2D with pixel-art style shapes (no sprites)
- **Game Engine**: Custom JS engine with game loop, physics, collision detection, camera, input

## Core Requirements (Static)
1. Playable 2D platformer with responsive movement
2. 3-hit ground combo, air swat, downward smash combat
3. Sticker-based health (3 stickers, chipping system)
4. Scrap meter (charges from combat + pickups)
5. 6 timed powers (15s each, one-at-a-time)
6. 4 enemy families: Root Crawler, Gear Bug, Flicker, Heavy
7. Pickups: coins, scrap, food, power orbs
8. Breakable walls/floors
9. HUD with health, coins, scrap meter, power icon+timer, score
10. Title screen, controls overlay, game over/victory screens
11. 5 levels with progression

## What's Implemented (Jan 2026)
- Full game engine (60fps canvas rendering, physics, AABB collision)
- Player character Axel with movement (WASD/arrows), jumping (coyote time + jump buffer), 3-hit combo, air attack, downward smash
- All 4 enemy types with patrol/chase AI, hit reactions, death particles
- All pickup types (coin, scrap, food, power orbs)
- Breakable walls and floors (smash-only floors, Burning Buffalo passthrough)
- 6 power system (Burning Buffalo, Shadow Tag, Golden Gloves, Super Mode, Specter Mode, Fighter Plane)
- Sticker health + scrap meter
- Full HUD overlay
- 5 levels: Overgrown Outskirts, Rust Climb, Hidden Depths, Buffalo Gate, Siege Core
- Title screen with AI-generated character art and background
- Controls overlay with keyboard mappings
- Game over / Victory screens with score
- Backend API for score saving + leaderboard
- Level transition animations
- Flight log system
- Parallax scrolling backgrounds
- Camera shake, hit stop, damage particles

## User Personas
- Indie game developers prototyping platformer mechanics
- Fans of retro 2D action platformers (SMW2, Metal Slug)
- Game design students studying combat systems

## Prioritized Backlog
### P0 (Done)
- Core gameplay loop, all 5 levels, full combat system

### P1 (Next)
- Boss fight (Rootbound Siege Tank) with attack/vulnerable/recover phases
- Fox Spirit post-boss guide event
- Hidden alcove reveal
- Animated sprite sheets (replace polygon rendering)
- Sound effects and music

### P2 (Future)
- Dedicated Flight Log panel with scroll and category filters
- More enemy variants per family
- Power-specific animations and visual effects
- Mobile/touch controls support
- Authored pixel art icon sprites for HUD
- Save/load game progress to backend
- Leaderboard display page
- Level select screen

## Next Tasks
1. Implement boss fight mechanics (Rootbound Siege Tank)
2. Add Fox Spirit guide NPC after boss defeat
3. Add sound effects (wrench swings, enemy hits, coin pickups)
4. Replace polygon-rendered characters with pixel sprite sheets
5. Add more enemy variety per level
