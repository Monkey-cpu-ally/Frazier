# Hyper Axel — Unity 6 URP 2D Export

This is a Unity 6 port of the **Hyper Axel: Shattered Mirrors** gameplay logic
from the HTML5/React prototype (`/app/frontend/src/game/*`) and the original
Godot project. All physics constants, power definitions, enemy taxonomy, scrap
assist tiers, workshop upgrade tree, daily challenge seed logic, and achievement
triggers have been translated into idiomatic C#.

## Requirements

- **Unity 6** (tested against `6000.0.30f1` — any 6000.x LTS should work)
- Unity Hub → *Installs* → add version **6000.0.30f1** (or later 6000.x)
- Modules: **Universal Render Pipeline** (installed by default)

## First run — 60 seconds to playable

1. Unity Hub → *Add* → select this folder → open the project.
2. Unity will import, compile, then show an empty project. Wait until compilation
   finishes (look at the bottom-right spinner).
3. Menu bar: **HyperAxel → Create Starter Scene**.
   That will:
   - Create `Assets/Settings/URP/HyperAxel_URP.asset` (URP 2D pipeline).
   - Create `Assets/Scenes/SampleScene.unity` with a camera, a ground tilemap,
     the Player with `AxelController` wired, the managers, and an HUD Canvas.
   - Assign the URP asset as the active render pipeline.
   - Register the scene with Build Settings.
4. Press **Play**. Controls out-of-the-box:
   - `A / D` or arrows — move
   - `Space / W / ↑` — jump (coyote + buffer preserved from the Godot build)
   - `Left Shift` — dash
   - `J` or left-click — attack
   - `Q` — trigger Scrap Assist (needs an `AssistManager.scrap` value > 20)
   - `E` — interact with hubs
   - `Esc` — pause (hook your own UI)

## Project layout

```
Assets/
├── Editor/                    # One-click starter, editor tooling
├── Prefabs/                   # Drop your own prefabs here
├── Resources/
│   └── WorkshopUpgradeTree.asset   # Created on first starter run
├── Scenes/SampleScene.unity
├── Scripts/
│   ├── Core/
│   │   ├── GameManager.cs          # Global state, run timer, score
│   │   ├── AssistManager.cs        # Scrap Assist tiers (green/yellow/orange/red)
│   │   ├── PowerManager.cs         # Timed power-ups + singleton lookup
│   │   └── AchievementTracker.cs   # 15 unlock hooks (call from gameplay)
│   ├── Daily/DailyChallenge.cs     # Deterministic UTC-seeded modifiers
│   ├── Data/LevelData.cs           # ScriptableObject per level
│   ├── Enemies/EnemyBase.cs        # Armor / flicker / percent-damage helpers
│   ├── Hub/Interactable.cs         # E-to-open kiosks
│   ├── Input/InputBridge.cs        # Optional new-Input-System adapter
│   ├── Player/AxelController.cs    # Movement, wall jump, dash, power hooks
│   ├── UI/HUDController.cs         # Hearts, scrap meter, timer, daily banner
│   └── Workshop/
│       ├── WorkshopUpgradeTree.cs  # ScriptableObject (editable in Inspector)
│       └── WorkshopController.cs   # Persists upgrades via PlayerPrefs
├── Settings/
│   ├── Input/PlayerControls.inputactions
│   └── URP/                        # Generated on first starter run
└── Sprites/Enemies/                # Gemini-generated claymation sprites
    ├── Heavy.png
    ├── GearBug.png
    ├── RootCrawler.png
    └── Flicker.png
```

## Physics tuning reference

Values tuned over 7 iterations in the Godot + HTML5 prototypes:

| Constant              | Value   | Notes                                     |
|-----------------------|---------|-------------------------------------------|
| `moveSpeed`           | 260     | horizontal px/s → scaled `/60` in Unity   |
| `jumpVelocity`        | 11      | Rigidbody2D linear velocity               |
| `gravityScale`        | 3       | base; multiplied by biome/waterfall       |
| `fallGravityMul`      | 1.8     | snappier falls                            |
| `lowJumpGravityMul`   | 2.2     | variable jump height                      |
| `maxFall`             | 18      | terminal y-velocity                       |
| `coyoteTime`          | 0.12 s  | Godot-style forgiving ledge grace         |
| `jumpBuffer`          | 0.12 s  | pre-land input buffer                     |
| `dashDuration`        | 0.18 s  |                                           |
| `dashCooldown`        | 0.6 s   | grounded resets `canDash`                 |
| `invTime`             | 0.6 s   | i-frames after taking damage              |
| `wallSlideSpeed`      | 1.8     | clamp while clinging                      |
| `wallJump`            | (8, 10) | off-wall impulse                          |
| `waterfallGravityMul` | 2.5     | `engine.js` biome event                   |
| `dreamGravityMul`     | 0.6     | dream biome                               |

## Porting the remaining biomes / bosses

Boss logic and per-biome enemy variants are scaffolded in `EnemyBase` but not
populated. Your next steps:

1. Create `EnemyBase` subclasses (e.g. `RootCrawler : EnemyBase`) and override
   `AI()` to mirror each `enemies.js` class.
2. Make a `LevelData` asset per level (Assets → Create → HyperAxel → Level Data).
   Fill in platforms, spawn points, and the waterfall trigger.
3. Use Cinemachine (already in `Packages/manifest.json`) for camera follow.
4. Wire HUD Canvas fields in the HUD prefab — all fields are public.

## Daily Challenge

`DailyChallenge.TodayChallenge()` produces the exact same modifier as
`GET /api/daily-challenge` from the FastAPI backend — same MD5→uint→modulo
algorithm, same 6-modifier pool (Glass Cannon, No Mercy, Scrap Famine, Mirror
Mania, Iron Fist, Golden Hour). Call it at run start:

```csharp
var mod = HyperAxel.DailyChallenge.TodayChallenge();
HyperAxel.DailyChallenge.Apply(mod);
```

## Workshop upgrades

`WorkshopController.BuyDamage()` / `.BuyStabilizer()` purchase the next tier,
deduct scrap, and push `upgradeBonus` / `malfunctionReduction` into the
`AssistManager`. Drive these from your own Workshop UI (port of `Workshop.js`).

## Known-stubbed / todo

- Boss arena logic (placeholder only)
- Tilemap level content (starter is one row of ground tiles)
- Audio — SFX hooks exist but no clips are bundled
- UI skinning — HUD text shows raw values; style it to match your vibe

## Credits

- Physics + game feel: Axel (player) tuning from the Godot/HTML5 prototype
- Enemy sprites: generated with Gemini Nano Banana
- Translation layer: FastAPI + React → C# MonoBehaviours / ScriptableObjects
