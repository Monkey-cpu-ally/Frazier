# Hyper Axel: Shattered Mirrors - PRD (Final)

## Complete Game (Jan 2026)

### 11 Levels (10 + 1 secret)
1. Overgrown Outskirts | 2. Rust Climb | 3. Hidden Depths | 4. Buffalo Gate
5. Siege Core (Boss) | 6. Scrap's Workshop | 7. Canopy Run | 8. Pipe Network
9. Mirror Vault | 10. Shattered Core | 11. The Other Side (NG+ secret)

### Core Systems
- Godot-accurate physics (wall slide/jump, dash, gravity multipliers)
- 3-hit combo + air attack + downward smash
- 4 enemy types with ledge detection AI + boss
- 6 timed powers, sticker health, scrap meter
- Mirror Fragment system (4 normal, 5th in NG+)
- Dialogue system (Scrap + Fox Spirit, 12+ sequences)
- Secret Ending cinematic (triggers when all fragments collected)
- New Game+ (faster/tougher enemies, relocated fragments, hidden 11th level)

### UI
- Cinematic intro (Shattered Mirrors, 8s)
- Game UI Design System (15+ components)
- 4-tab menu (Play/Levels/Scores/More)
- More hub: Powers, Workshop (8 wrench skins), Achievements (15), Mirror Gallery (4 lore entries)
- Pause, Settings, Controls, Touch controls

### Backend
- Score leaderboard, save/load progress, achievement definitions API

### Audio
- SFX + procedural music (exploration/boss/menu) via Web Audio API


## QA / Bug-Hunt Pass (Feb 20, 2026)

User requested "LETS LOOK FOR PROBLEMS IN THIS DEMO". Audited codebase and fixed 9 bugs:

### Critical
- **Dialogue freeze**: `engine._loop` dialogue branch was returning without `requestAnimationFrame`, freezing the game every time a dialogue triggered. Added missing RAF call.
- **GameCanvas ignored props**: `paused`, `startLevel`, `settings`, and `ref` were passed from App.js but the component only accepted `onStateChange`. Rewrote with `forwardRef` + `useImperativeHandle` and propagated props to engine via `useEffect`.
- **Enemy wall-climb**: `_resolveGround` was snapping any side-touching enemy onto a platform top. Tightened to only land when feet cross the platform top within an 8px tolerance.
- **Flicker falls**: `FlickerEnemy._ai` set `vy` but base `update()` then added gravity again, negating the hover. Gave Flicker its own `update()` that skips gravity and bobs around `baseY`.

### High
- **Camera shake setting**: Added `shakeEnabled` flag to Camera; `shake()` early-returns when disabled; GameCanvas syncs it from `settings.screenShake`.
- **ESC priority**: `Escape` now closes any open overlay (controls/settings/workshop/achievements/gallery) before opening pause. In-game ESC toggles pause as before.
- **Restart flicker**: Removed the `setScreen('restart')`+setTimeout hack. Restart now bumps a `restartKey` that remounts GameCanvas, fully reinitializing the engine without a blank frame.
- **Chase-off-ledge**: Enemies now check for ground in front of them during chase and stop/turn at ledges instead of running off.
- **roundRect polyfill**: Added in engine constructor so iOS Safari <16 / older Firefox don't crash.

### Engine API hardening
- `engine.start(startLevel)` now accepts a starting level index.
- `engine.restart(levelIndex)` now accepts a level index (defaults to 0) so pause-menu restart can preserve the selected level if wired directly.

### Verified
iteration_6.json — 100% pass on frontend + backend. No blocking issues remaining.
