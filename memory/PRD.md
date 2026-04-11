# Hyper Axel: Wrenchbound - PRD

## Original Problem Statement
Build a browser-playable 2D action platformer called "Hyper Axel" based on the Godot game "Axel: Wrenchbound". The game features Axel, a black/brown girl mechanic with a red cap and wrench weapon, navigating overgrown urban-mechanical ruins. 80% soft/rounded (SMW2 influence), 20% impact punctuation (Metal Slug influence). Bold art style inspired by fighting game aesthetics (Cerebrawl reference).

## Architecture
- **Frontend**: React 19 + HTML5 Canvas 2D game engine (custom)
- **Backend**: FastAPI + MongoDB (score persistence/leaderboard)
- **Audio**: Web Audio API synthesized retro SFX (no audio files needed)
- **Art**: AI-generated hero art + canvas-rendered pixel characters with bold outlines

## What's Implemented (Jan 2026)

### Core Game Engine
- Custom 60fps game loop with delta time, hit stop, camera shake
- AABB collision detection for platforms, enemies, pickups, breakables
- Parallax scrolling with multi-layer backgrounds
- Ambient particle system (dust motes, floating leaves)

### Player (Axel)
- Responsive movement with acceleration/friction, air control
- Coyote time (0.1s) + jump buffering (0.1s)
- 3-hit ground wrench combo with increasing power
- Air swat attack
- Downward smash (S+X in air) for breaking floors
- Sticker-based health (3 stickers, chip damage system)
- Invincibility frames with blink effect
- Knockback on damage
- Bold dark outlines and detailed pixel rendering

### Combat & Powers
- 6 timed powers (15s each, one-at-a-time): Burning Buffalo, Shadow Tag, Golden Gloves, Super Mode, Specter Mode, Fighter Plane
- Shadow Tag leaves afterimage trail
- Golden Gloves = double damage
- Super Mode = speed + jump boost
- Specter Mode = phase through enemies
- Burning Buffalo = charge through breakable walls

### Enemies
- Root Crawler (Dinosaur Family) - green, patrol AI, 2HP
- Gear Bug (Machine Family) - teal with rotating gear, fast patrol, 2HP
- Flicker Enemy (Element Family) - purple with glow, floats, 3HP
- Heavy Enemy (Machine Family) - steel-blue with green weak point, 5HP
- All enemies: patrol/chase AI, hit reactions, death particles, scrap drops

### Boss Fight
- Rootbound Siege Tank boss with full phase system
- Attack patterns: charge (bounces off walls), slam (creates debris projectiles)
- Telegraph/warning indicators before attacks
- Vulnerable phase after wall impact or 3 slams (glowing weak point)
- Recovery phase, speed increase at low HP
- HP bar, roar, death explosion sequence
- Fox Spirit NPC appears after boss defeat with path-following guide

### Levels (5)
1. Overgrown Outskirts - intro platforming + coins
2. Rust Climb - vertical platforms + mixed enemies
3. Hidden Depths - breakable floor puzzle, secret underground area
4. Buffalo Gate - power pickup + breakable wall reward
5. Siege Core - boss arena with all enemy types + Golden Gloves power

### Visual Design
- AI-generated graffiti-style "HYPER AXEL" logo (Cerebrawl-inspired)
- AI-generated bold character art of Axel with wrench
- Overgrown urban ruins background (parallax, painted style)
- Canvas-rendered characters with thick dark outlines
- Ambient dust/leaf particle system
- Hit flash, damage particles, death effects, camera shake

### Audio (Web Audio API)
- Jump, land, wrench swing, wrench hit, combo finish
- Smash, player hurt/death
- Enemy hit/death
- Coin/scrap/food/power pickups
- Breakable wall destruction
- Boss: roar, hit, vulnerable, death
- Fox Spirit appearance
- Level complete fanfare
- UI click/start sounds

### HUD & UI
- Sticker heart health display with chip damage
- Coin counter, scrap meter, score
- Power icon with circular timer
- Level name indicator
- Pickup text popups
- Flight Log (TAB key) - full panel with category-colored entries
- Title screen with graffiti logo + character art
- Controls overlay with keyboard mappings
- Game over / Victory screens

### Backend
- FastAPI score persistence
- POST /api/scores - save score
- GET /api/scores/top - leaderboard (top 10)
- GET /api/health - status check

## Backlog
### P1
- Replace AI-generated images with proper transparent PNGs
- Mobile/touch controls
- More levels (6-10)
- Additional enemy variants per family
- Animated sprite sheets for Axel

### P2
- Leaderboard display page
- Level select screen
- Save/load progress
- Background music (procedural)
- Cutscene system
- Achievement system
