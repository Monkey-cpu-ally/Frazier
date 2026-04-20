# Hyper Axel: Shattered Mirrors - PRD

## Full Feature List (Jan 2026)

### 10 Levels
1. Overgrown Outskirts (intro)
2. Rust Climb (vertical + mixed enemies)
3. Hidden Depths (breakable floor, secret area)
4. Buffalo Gate (power + wall interaction)
5. Siege Core (boss: Rootbound Siege Tank + Fox Spirit)
6. Scrap's Workshop (old base, Scrap dialogue)
7. Canopy Run (no-ground treetop platforming)
8. Pipe Network (wall jump challenge, industrial)
9. Mirror Vault (crystal realm, fragment hunting)
10. Shattered Core (final gauntlet, all enemies)

### Mirror Fragment System
- 4 hidden crystal fragments across levels 5, 7, 8, 9
- Rainbow-glowing diamond pickup with sparkle particles
- HUD counter (top-right) with rotating hue diamond icon
- Dialogue triggers on each pickup + special dialogue when all 4 collected
- Leads to secret ending (Shattered Mirrors narrative)

### Dialogue System
- DialogueManager with typewriter text, speaker portraits (Scrap/Fox)
- Auto-triggers at level start for levels with dialogueId
- Blocks gameplay input during dialogue
- SPACE/X to advance, auto-complete on first press
- 12 dialogue sequences covering all levels + mirror fragments

### Godot-Accurate Physics
- move_toward acceleration/friction, gravity multipliers
- Wall slide (120px/s), wall jump (280x, -360y)
- Dash (SHIFT: 520 speed, 0.14s, 0.2s cooldown)
- Enemy ledge detection (check ground ahead before moving)

### Complete UI System
- Cinematic intro (8s Shattered Mirrors sequence)
- Title → Menu → Game flow
- 5-tab menu (Play/Levels/Scores/Powers/Workshop)
- Pause (ESC), Settings, Controls overlay
- Scrap's Workshop (wrench skins)
- Game UI Design System (15+ reusable components)

### Audio
- SFX: all actions (Web Audio API synthesized)
- Music: procedural exploration/boss/menu tracks
- Dialogue: crystal chimes for fragment collection

## Backlog
- P1: Claymation enemy art generation (quota hit, retry next session)
- P1: Save/load progress to backend
- P2: Achievement system, cutscene system
- P2: Secret ending animation when all fragments collected
