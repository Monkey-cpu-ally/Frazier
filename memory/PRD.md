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


## Godot PR #7 Port (Feb 20, 2026)

User shared their Godot repo `github.com/Monkey-cpu-ally/atlas-core` PR #7. Main agent ported the new systems into the HTML5 game and fixed the 4 bugs Cursor Bugbot flagged in the original GDScript.

### New systems added to HTML5 port
- **Scrap Assist System** (NEW FILE `assists.js`) — meter-driven call-in system with 4 tiers:
  - Green (<25%): SupplyDrop parachutes crate -> heal 1 sticker or +10 scrap (50/50)
  - Yellow (25-49%): GroundAssistActor charges from left; weak enemies in 180px die, large take 10% dmg
  - Orange (50-74%): same actor; 15%/10% dmg, ~30% malfunction self-damage
  - Red (75%+): FighterPlaneAssist airstrike (machine-gun OR bomb, 20%/30% dmg in 220/180px radius)
  - Q key triggers; full meter drained per call-in; upgrade bonus hooks in place
- **Enemy taxonomy** — `family` (dinosaur/machine/element) + `sizeClass` (weak/large) on every enemy. Flight log shows family. `isWeak()`/`isLarge()` predicates.
- **Heavy Chassis armor** — HP 5 -> 12; normal attacks show "Heavy shell shrugged it off!"; only Golden Gloves, Burning Buffalo, or downward smash damages them; empowered hits deal +1 bonus.
- **Flicker blink invuln** — Flickers cycle open/closed every 0.95s; attacks during closed phase show "Flicker shell sealed!" and deal no damage; visually dim to 0.32 alpha when sealed.
- **Fox Statue** — Level 8 Mirror Vault; E-key interact, heals 2 stickers, visually dims after use, glowing blue eyes.
- **Assist tiered HUD meter** — 4-color fill with threshold ticks at 25/50/75%, label `SCRAP • <TIER>`, `[Q] ASSIST` hint when >=20.
- **Touch ASSIST button** for mobile.

### Godot PR #7 bugs fixed (not carried over into JS port)
1. Heavy category string mismatch — we use a boolean `armored` flag instead.
2. Flicker category string mismatch — we use a boolean `flicker` flag instead.
3. `receive_contact_hit` missing arg — N/A in JS port (we use engine-level collision).
4. `restore_hits` accidentally damaged — our `healSticker()` is direct and correct.

### Verified
iteration_7.json — 100% frontend pass. No JS errors. All code paths reviewed.

## Scrap Assist Upgrade Tree (Feb 20, 2026)

Added to Scrap's Workshop a new "ASSIST UPGRADES" tab with two paths (mirrors Godot `upgrade_scrap_damage` + malfunction reduction hooks):
- **Strike Damage Core** — Tier 1/2/3: +5% / +10% / +15% bonus to Yellow/Orange/Red assist damage (costs 30/80/180 scrap).
- **Stabilizer Module** — Tier 1/2/3: -5% / -10% / -15% Orange malfunction chance (costs 25/75/150 scrap).

Tiers must be purchased in order. Progress persists to backend via `POST /api/progress` with new fields `assist_damage_level` and `assist_stabilizer_level`. Scrap earned per run is accumulated on gameover/victory into `progress.total_scrap` and persisted. `GameCanvas` maps the stored tier levels into engine runtime values (`engine.assistUpgradeBonus`, `engine.assistMalfunctionReduction`).

Backend: `GameProgress` / `ProgressUpdate` pydantic models extended with two new int fields. Curl-verified save/load round-trip.

