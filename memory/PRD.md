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


## Iteration 8 — "All" Feature Bundle (Feb 20, 2026)

User said "All" to a plan bundling 4 features. All landed green via testing agent (iteration_8.json, 100% backend pytest + frontend flows).

### 1. Achievement Unlock System
- `AchievementTracker` in `systems.js` — manages 15 achievement IDs + per-run counters (kills, wall-jumps, dashes, combo-3s, powers used, damage taken, level-1 timer).
- Hooks fire from: `player.js` (wall-jump, dash, combo-3, damaged), `enemies.js` (enemy killed), `pickups.js` (power activated), `engine.js` (boss defeated, level completed, mirror fragment, coin/scrap threshold sync).
- Sonner toast pops top-right with gold border when an achievement unlocks. Duplicate unlocks suppressed via seeded `unlockedAchievements` from persisted progress.
- Persisted to backend via POST /api/progress.

### 2. Speedrun Timer Mode
- Toggle on Play tab of Main Menu (`menu-speedrun-toggle`).
- In-game HUD renders a yellow MM:SS.cc timer box top-right when `engine.speedrunMode` is true.
- Freezes on victory; `runFinalMs` + `level1TimeMs` persisted to `best_run_time_ms` / `best_l1_time_ms`.
- Best times displayed on Main Menu when present.

### 3. Wrench Skin Persistence
- Workshop SKINS tab shows 8 skins; equipped shows yellow EQUIP badge + EQUIPPED label.
- Owned-but-not-equipped shows EQUIP button; locked shows UNLOCK (cost) button (disabled if insufficient scrap).
- Scrap spent on unlock deducts from `progress.total_scrap`.
- `wrench_skin` + `unlocked_skins` persisted to backend. Engine maps equipped skin id → player.skinColor for in-game wrench color.

### 4. Claymation Enemy Sprites
- 3 of 4 enemy types now render as Gemini Nano Banana PNG sprites (root_crawler, gear_bug, heavy) at `/enemies/*.png`.
- Generator script at `/app/backend/scripts/generate_enemy_art.py` (one-shot, reusable).
- Flicker still procedural (blink alpha animation tied tightly to code; budget also exhausted on 4th image).
- `ENEMY_SPRITES` preload + `_drawSprite` fallback method in `enemies.js` render().

### Backend schema extended
`GameProgress` + `ProgressUpdate`: new fields `unlocked_skins: List[str] = ["standard"]`, `best_run_time_ms: int = 0`, `best_l1_time_ms: int = 0`. Pytest 8/8 in `/app/backend/tests/test_progress_iter8.py`.


## Iteration 9 — PR Continuation + Daily Challenge + Global Leaderboard (Feb 20, 2026)

User said "All but first keep pulling from pr" — meaning skip the manual-playthrough item, pull more from PR first, then do the rest (leaderboard + daily challenge).

### Pulled from PR #7 (atlas-core)
Re-audited the Godot repo. Everything substantive was already ported (3-phase boss, Fox Spirit, Scrap Assist system, Fox Statue, enemy taxonomy/armor/blink, etc). The last missing piece was **Hint Prompt Triggers** — `hint_prompt_trigger.gd` area-based banners. Ported as `hintTriggers` array on level configs with once-fire AABB check in `engine._update`. Added triggers to levels 0, 1, 2, 3, 4, 8 covering: move/attack guidance, wall-slide tip, dash tip, smash tip, boss vulnerability hint, fox statue E-key hint, hidden fragment hint.

### New: Daily Seeded Challenge
Backend `/api/daily-challenge` (GET) returns `{date, modifier, seed}`. Seed is md5-hashed UTC date → picks 1 of 6 modifiers (glass_cannon, no_heal, scrap_famine, mirror_mania, iron_fist, golden_hour). Each modifier applies to engine: dmg_mul, dmg_taken_mul, no_heal (food/fox-statue blocked), scrap_mul, enemy_speed_mul, no_dash, coin_mul, score_mul.

Main Menu Play tab shows **Daily Challenge Card** (orange border, modifier name + desc + PLAY CHALLENGE button). Clicking auto-enables speedrunMode + dailyMode. When victory fires, POST `/api/daily-challenge/complete` records completion (keyed by `player_id:YYYY-MM-DD`). Card shows green "CLEARED TODAY" badge + "REPLAY CHALLENGE" button after.

In-game: orange "DAILY CHALLENGE / <MODIFIER NAME>" banner top-left. Toast "🎯 Daily Challenge cleared!" on completion.

### New: Global Speedrun Leaderboard
Backend `/api/leaderboard/speedrun` (POST + GET top 10 ASC). Auto-submits on victory when speedrunMode is on (player_name from localStorage fallback "Axel"). Main Menu Scores tab now renders two sections — classic Top Scores + new Speedrun Leaderboard (`data-testid=speedrun-leaderboard`) with rank/name/MM:SS.cc, #1 highlighted gold.

### Backend polish
- Daily seed upgraded from `sum(ord())` to `md5()` for even distribution across adjacent dates.
- POST `/api/leaderboard/speedrun` returns HTTP 400 (not 200) on `total_ms <= 0`.

### Verified
iteration_9.json — 100% pass: 10/10 new pytest + 8/8 iter8 regression + full UI flows (daily card, in-game banner, leaderboard, regular start-mission regression). Zero JS errors.

