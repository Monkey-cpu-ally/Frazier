extends "res://scripts/entities/enemy_base_3d.gd"
##
## Flicker 2.5D — floats (no gravity), TELEPORTS to a flanking side after
## surviving a hit. Mirrors the HTML5 FlickerEnemy behavior.

@export var teleport_offset_min : float = 3.0
@export var teleport_offset_max : float = 5.0
@export var bob_speed : float = 2.4
@export var bob_amount : float = 0.35

var _base_y : float = 0.0
var _sealed_t : float = 0.0

func _ready() -> void:
    super._ready()
    _base_y = global_position.y

func _physics_process(delta: float) -> void:
    if not alive: return
    anim_t += delta
    if hurt_t > 0.0: hurt_t -= delta
    if flash_t > 0.0: flash_t -= delta
    if _sealed_t > 0.0: _sealed_t -= delta
    _ai(delta)
    # Float — ignore gravity, bob around base_y and track player height slowly
    velocity.y = ((_base_y + sin(anim_t * bob_speed) * bob_amount) - global_position.y) * 6.0
    global_position.z = 0.0
    move_and_slide()
    if _sprite:
        _sprite.scale.x = dir
        _sprite.modulate = Color(1.5, 0.8, 0.8) if flash_t > 0.0 \
            else (Color(1, 1, 1, 0.35) if _sealed_t > 0.0 else Color(1, 1, 1))

func _ai(delta: float) -> void:
    var pl := _find_player()
    if pl == null:
        velocity.x = dir * speed
        return
    var to_player_x := pl.global_position.x - global_position.x
    dir = 1 if to_player_x > 0.0 else -1
    velocity.x = dir * speed * 1.1
    # Drift baseline y slowly toward player's y so it can chase across gaps.
    _base_y = lerp(_base_y, pl.global_position.y + 0.4, clampf(delta * 0.4, 0.0, 1.0))

func take_damage(amount: int, from_pos: Vector3, knockback: Vector3) -> void:
    var was_hp := hp
    super.take_damage(amount, from_pos, knockback)
    if not alive or hp <= 0: return
    if hp == was_hp: return
    # Teleport to flanking side near the player.
    _spawn_smoke_poof()
    var pl := _find_player()
    if pl:
        var side : int = 1 if global_position.x > pl.global_position.x else -1
        var off : float = randf_range(teleport_offset_min, teleport_offset_max)
        global_position.x = pl.global_position.x + side * off
        _base_y = pl.global_position.y + 0.5
        global_position.y = _base_y
    velocity = Vector3.ZERO
    _sealed_t = 0.4                 # brief invuln after teleport
    _spawn_smoke_poof()

func _find_player() -> Node3D:
    var list := get_tree().get_nodes_in_group("player")
    return list[0] if list.size() > 0 else null

# While sealed, the Flicker takes no damage.
func _can_be_damaged() -> bool:
    return _sealed_t <= 0.0
