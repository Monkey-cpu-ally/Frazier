# Hyper Axel — 2.5D Mode (Godot 4)

This adds a 2.5D rendering path to your existing Godot 4 project. Your original
2D scenes (`Level1.tscn`, `Room1-5.tscn`, etc.) are untouched — this is a new
Node3D scene that reuses the same pixel-art sprites as billboards.

## What's new

```
scenes/Level1_25D.tscn          — 2.5D demo scene (press F5 then pick this)
scripts/player/axel_movement_3d.gd — CharacterBody3D port of axel_movement.gd
scripts/camera25d.gd             — Orthographic follow camera (tilt-ready)
sprites/*.png                    — Pixel-art textures (Gemini-generated, RGBA)
```

## How it works

- **Camera3D is orthogonal** — 2D look, 3D math. Size defaults to 10 (frames
  ~18 world units wide). A small `rotation_degrees.x = -6°` tilt gives the
  game a subtle parallax-depth feel without losing the side-scrolling vibe.
- **Sprite3D with billboard mode** — enemies and the player are quads that
  always face the camera. Because we tilt the camera ~6°, they look like 3D
  cardboard cut-outs in a 3D world (classic 2.5D, Paper-Mario / Octopath feel).
- **CharacterBody3D controller** — all the movement feel constants from
  `axel_movement.gd` (coyote 0.12s, jump buffer 0.12s, variable gravity,
  dash 0.18s, wall-slide 1.8 clamp, wall-jump (8, 10)) are preserved.
- **Z is locked to 0** every frame so the player can't drift out of the 2D plane.

## First run

1. Open the project in **Godot 4.2+** (Godot Hub → *Add project* → point at
   `HyperAxel/project.godot`).
2. Wait for the importer to re-scan the new `sprites/*.png` files.
3. In the FileSystem panel, open `scenes/Level1_25D.tscn`.
4. Press **F6** (Run current scene). You'll spawn in the demo 2.5D level with
   4 enemies and a ground slab. Controls:
   - **A/D** or **←/→** — move
   - **Space** — jump (coyote + buffer preserved)
   - **Shift** — dash
   - **J** — attack (not wired in 2.5D yet — see "next steps")

## Tuning cheatsheet

| Knob | Where | Default | Effect |
|------|-------|---------|--------|
| Camera size | Camera3D.size | 10 | Lower = zoom in, higher = zoom out |
| Camera tilt | Camera3D.rotation_degrees.x | -6° | More negative = more top-down feel |
| Sprite scale | Sprite3D.pixel_size | 0.006–0.010 | Pixels → world units |
| Jump height | `jump_velocity` on Player | 11.0 | Higher = springier |
| Gravity | `gravity` on Player | 32.0 | Higher = snappier falls |
| Dash distance | `dash_speed × dash_duration` | 14.5 × 0.18 ≈ 2.6 units | |
| Billboard mode | Sprite3D.billboard | 1 (Y-locked) | 2 = full billboard |

## Next steps (hand-done work you'll do in the editor)

1. ~~**Attack hitbox**~~ ✅ DONE — `AttackHitbox` Area3D child on Player,
   `scripts/player/axel_attack_hitbox_3d.gd` handles weak/mid/heavy combo
   (1.0× / 1.25× / 1.75× damage) with a 0.45s chain window.
2. ~~**Enemy AI scripts**~~ ✅ DONE — `enemy_base_3d.gd` plus personalities:
   `gear_bug_3d.gd` (hops), `heavy_enemy_3d.gd` (charges), `flicker_enemy_3d.gd`
   (teleports after surviving a hit with smoke poof), `root_crawler_3d.gd`
   (baseline patrol). All registered in `Level1_25D.tscn`.
3. **Level layout** — the demo has one flat ground slab. Build real levels by
   adding more `StaticBody3D + CSGBox3D` platforms or, better, a MultiMesh
   grid for chunked terrain.
4. **Parallax backdrop** — add 2–3 more Sprite3D quads at different Z depths
   (z = -4, -8, -14) with distant scenery textures — the camera tilt will
   give free parallax.
5. **Player health + UI** — port `axel_sticker_health.gd` and `hud.gd` to
   display 3 hearts in a CanvasLayer above the 3D scene.

## Why Sprite3D + billboard instead of real 3D meshes?

- Keeps the chunky pixel-art / claymation aesthetic intact.
- 10× less art work — the Gemini-generated sprites in `sprites/` Just Work.
- Frame-perfect replication of the 2D physics feel via Z-lock.
- Trivially upgrade later: swap any Sprite3D for a MeshInstance3D without
  touching the camera, controller, or collision.

## Known gotchas

- **Sprite cut-off at the bottom** — `pixel_size` is relative to texture
  height. If enemies look tiny, raise pixel_size. If they poke into the
  ground, raise the Node3D's y transform until their feet sit on 0.
- **Alpha fringing** — I set `alpha_cut` to `ALPHA_CUT_DISCARD` on every
  Sprite3D so anti-aliased edges don't pick up the skybox. If you see pink
  outlines, lower `alpha_scissor_threshold` toward 0.3.
- **Input events named differently in 3D** — this scene reuses the same
  `move_left/move_right/jump/dash` actions from `project.godot`. No change
  needed.
