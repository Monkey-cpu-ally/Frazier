extends CanvasLayer
class_name HUD25D
##
## 2.5D HUD — draws sticker-style pixel hearts + coin count + score + pickup
## banner over the 3D viewport. Wires to an Axel CharacterBody3D's $Health node.
##
## Scene recipe:
##   Level1_25D (Node3D)
##   ├── Player (CharacterBody3D)
##   │   └── Health (AxelHealth25D)
##   └── HUD (this script, auto-finds Player if `player_path` is unset)
##
## No GameState autoload required — HUD also exposes public `add_coins()`,
## `add_score()`, `show_pickup()` so pickups can call them directly.

@export var player_path : NodePath
@export var hearts_full_color    : Color = Color(0.89, 0.23, 0.18, 1)
@export var hearts_empty_color   : Color = Color(0.08, 0.06, 0.08, 0.8)
@export var hearts_chip_color    : Color = Color(0.40, 0.10, 0.08, 1)
@export var text_color           : Color = Color(0.96, 0.93, 0.85, 1)
@export var pickup_duration      : float = 2.4

var coins        : int = 0
var score        : int = 0
var pickup_text  : String = ""
var pickup_timer : float  = 0.0

var _health : Node = null
var _hearts_root : Control = null
var _heart_nodes : Array[Control] = []
var _coin_label : Label = null
var _score_label : Label = null
var _pickup_label : Label = null

func _ready() -> void:
    layer = 10
    _build_hud()
    _wire_player()

func _build_hud() -> void:
    # Top-left bar (hearts + coins + score)
    var root := Control.new()
    root.name = "Root"
    root.anchor_right = 1.0
    root.anchor_bottom = 1.0
    root.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(root)

    var top := HBoxContainer.new()
    top.position = Vector2(24, 18)
    top.add_theme_constant_override("separation", 22)
    root.add_child(top)

    # ── Hearts ──
    _hearts_root = HBoxContainer.new()
    _hearts_root.add_theme_constant_override("separation", 4)
    top.add_child(_hearts_root)
    for i in range(3):
        var h := _make_pixel_heart(true, 0)
        _heart_nodes.append(h)
        _hearts_root.add_child(h)

    # ── Coin counter ──
    var coin_box := HBoxContainer.new()
    coin_box.add_theme_constant_override("separation", 6)
    top.add_child(coin_box)
    var coin_icon := _make_coin_icon()
    coin_box.add_child(coin_icon)
    _coin_label = _make_label("x 0", 22)
    coin_box.add_child(_coin_label)

    # ── Score (right side) ──
    var right := HBoxContainer.new()
    right.position = Vector2(-260, 18)
    right.anchor_left = 1.0
    right.anchor_right = 1.0
    root.add_child(right)
    _score_label = _make_label("SCORE  0", 22)
    right.add_child(_score_label)

    # ── Pickup banner (center-top) ──
    _pickup_label = _make_label("", 26)
    _pickup_label.position = Vector2(-220, 64)
    _pickup_label.size = Vector2(440, 44)
    _pickup_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _pickup_label.anchor_left = 0.5
    _pickup_label.anchor_right = 0.5
    _pickup_label.modulate.a = 0.0
    root.add_child(_pickup_label)

func _make_label(txt: String, px: int) -> Label:
    var lbl := Label.new()
    lbl.text = txt
    lbl.add_theme_font_size_override("font_size", px)
    lbl.add_theme_color_override("font_color", text_color)
    lbl.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.9))
    lbl.add_theme_constant_override("shadow_offset_x", 2)
    lbl.add_theme_constant_override("shadow_offset_y", 2)
    return lbl

func _make_pixel_heart(full: bool, chip: int) -> Control:
    # A pixel-style heart drawn as 5 small ColorRects arranged in a heart silhouette.
    # chip: 0 = full, 1 = minor chip, 2 = major chip, 3 = gone.
    var cell := 8                                            # pixel cell size
    var w := cell * 7
    var h := cell * 6
    var root := Control.new()
    root.custom_minimum_size = Vector2(w, h)
    # heart shape cells (0,0 top-left). 1 = solid heart pixel.
    var grid : Array = [
        [0,1,1,0,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0],
        [0,0,0,1,0,0,0],
    ]
    for row in range(grid.size()):
        for col in range(grid[row].size()):
            var rect := ColorRect.new()
            rect.size = Vector2(cell, cell)
            rect.position = Vector2(col * cell, row * cell)
            var cell_full := grid[row][col] == 1
            if not cell_full:
                rect.color = Color(0, 0, 0, 0)
            else:
                # Choose color based on chip level + full/empty.
                if not full:
                    rect.color = hearts_empty_color
                else:
                    var px_idx := row * grid[row].size() + col
                    var total_cells := _count_heart_cells(grid)
                    var chip_cells := int(total_cells * (chip / 3.0))
                    # Chip spreads from bottom-right (later indices).
                    var ordered_idx := _heart_pixel_order_index(row, col, grid)
                    rect.color = hearts_chip_color if (ordered_idx < chip_cells) else hearts_full_color
            root.add_child(rect)
    # 1-pixel black border around each heart for retro read-out.
    return root

func _count_heart_cells(grid: Array) -> int:
    var n := 0
    for row in grid:
        for v in row:
            if v == 1: n += 1
    return n

func _heart_pixel_order_index(row: int, col: int, grid: Array) -> int:
    # Return the index of (row, col) among lit cells, ordered bottom-up-right-to-left
    # so chips visually eat the heart from the bottom-right corner first.
    var list : Array = []
    for r in range(grid.size()):
        for c in range(grid[r].size()):
            if grid[r][c] == 1:
                list.append(Vector2i(c, r))
    # Sort by (row DESC, col DESC)
    list.sort_custom(func(a, b): return (a.y > b.y) if a.y != b.y else (a.x > b.x))
    for i in range(list.size()):
        if list[i] == Vector2i(col, row):
            return i
    return 0

func _make_coin_icon() -> Control:
    var g := Control.new()
    g.custom_minimum_size = Vector2(32, 32)
    var cell := 8
    var grid := [
        [0,1,1,0],
        [1,1,1,1],
        [1,1,1,1],
        [0,1,1,0],
    ]
    for row in range(grid.size()):
        for col in range(grid[row].size()):
            if grid[row][col] == 1:
                var r := ColorRect.new()
                r.size = Vector2(cell, cell)
                r.position = Vector2(col * cell, row * cell)
                r.color = Color(0.97, 0.84, 0.37, 1)
                g.add_child(r)
    return g

func _wire_player() -> void:
    var pl : Node = null
    if player_path != NodePath(""):
        pl = get_node_or_null(player_path)
    if pl == null:
        var list := get_tree().get_nodes_in_group("player")
        if list.size() > 0: pl = list[0]
    if pl == null: return
    _health = pl.get_node_or_null("Health")
    if _health == null: return
    _health.sticker_lost.connect(_on_sticker_lost)
    _health.sticker_chipped.connect(_on_sticker_chipped)
    _health.died.connect(_on_died)
    _refresh_hearts(_health.stickers, _health.chip_level)

func _process(delta: float) -> void:
    if pickup_timer > 0.0:
        pickup_timer = max(pickup_timer - delta, 0.0)
        if _pickup_label:
            _pickup_label.modulate.a = min(1.0, pickup_timer / 0.3)
            if pickup_timer <= 0.0:
                _pickup_label.text = ""

func _refresh_hearts(remaining: int, chip: int) -> void:
    # Remove old heart nodes, rebuild from scratch for clarity.
    for child in _hearts_root.get_children():
        child.queue_free()
    _heart_nodes.clear()
    for i in range(3):
        var filled := i < remaining
        var chip_for_this := (chip if (i == remaining - 1 and filled) else 0)
        var h := _make_pixel_heart(filled, chip_for_this)
        _heart_nodes.append(h)
        _hearts_root.add_child(h)

func _on_sticker_lost(remaining: int) -> void:
    _refresh_hearts(remaining, 0)

func _on_sticker_chipped(chip: int) -> void:
    if _health: _refresh_hearts(_health.stickers, chip)

func _on_died() -> void:
    show_pickup("GAME OVER — press R to retry")

# Public API (pickups call these)
func add_coins(n: int = 1) -> void:
    coins += n
    if _coin_label: _coin_label.text = "x %d" % coins

func add_score(n: int) -> void:
    score += n
    if _score_label: _score_label.text = "SCORE  %d" % score

func show_pickup(txt: String) -> void:
    pickup_text = txt
    pickup_timer = pickup_duration
    if _pickup_label:
        _pickup_label.text = txt
        _pickup_label.modulate.a = 1.0
