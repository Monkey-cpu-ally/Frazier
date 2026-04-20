# Hyper Axel: Shattered Mirrors - PRD

## Complete Feature List (Jan 2026)

### Game
- 10 levels across 5 biomes (ruins, climb, depths, factory, workshop, canopy, pipes, crystal vault, shattered core)
- Godot-accurate physics (wall slide/jump, dash, gravity multipliers)
- Boss fight (Rootbound Siege Tank)
- 4 enemy types with ledge detection AI
- 6 timed powers, sticker health, scrap meter
- Mirror Fragment collectible system (4 hidden crystals)
- Dialogue system (Scrap + Fox Spirit, 12 sequences)

### UI System
- Cinematic intro (8s Shattered Mirrors animation)
- Game UI Design System (15+ reusable components)
- Main Menu (Play/Levels/Scores/More tabs)
- Level Select (10 levels with badges)
- Achievements (15 achievements, persistent via API)
- Mirror Gallery (4 lore entries unlocked by fragments)
- Scrap's Workshop (8 wrench skins)
- Pause Menu, Settings, Controls
- Mobile touch controls

### Backend
- Score persistence + leaderboard
- Save/load game progress (levels, fragments, achievements)
- Achievement definitions API
- MongoDB storage

### Audio
- SFX: all actions (Web Audio API)
- Music: procedural exploration/boss/menu tracks
- Secret ending audio

## Backlog
- P1: Claymation enemy art (image quota - retry next session)
- P1: Secret ending trigger when all fragments collected in-game
- P2: Cloud save sync, multiple save slots
