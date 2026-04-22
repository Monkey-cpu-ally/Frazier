extends "res://scripts/entities/enemy_base_3d.gd"
##
## Heavy 2.5D — personality: CHARGES when player within 8 world units.
## Telegraphs for 0.55s, then sprints at 3.5× speed for 0.9s, then cools down.

@export var charge_trigger_range : float = 8.0
@export var charge_speed_mul : float = 3.5
@export var charge_duration : float = 0.9
@export var telegraph_time : float = 0.55
@export var cooldown : float = 3.0

var _charge_t  : float = 0.0
var _warn_t    : float = 0.0
var _cd_t      : float = 2.0

func _ai(delta: float) -> void:
    if _charge_t > 0.0:
        velocity.x = dir * speed * charge_speed_mul
        _charge_t -= delta
        return
    if _warn_t > 0.0:
        velocity.x = 0.0
        _warn_t -= delta
        if _warn_t <= 0.0:
            _charge_t = charge_duration
            _cd_t = cooldown
            var pl := _find_player()
            if pl != null:
                dir = 1 if pl.global_position.x > global_position.x else -1
        # Red flash during telegraph
        if _sprite:
            _sprite.modulate = Color(2.0, 0.3, 0.3) if fmod(_warn_t * 10.0, 1.0) > 0.5 else Color(1, 1, 1)
        return

    _cd_t = max(_cd_t - delta, 0.0)
    # Fall back on base patrol
    super._ai(delta)

    var pl := _find_player()
    if pl and _cd_t <= 0.0:
        var d := abs(pl.global_position.x - global_position.x)
        if d < charge_trigger_range and is_on_floor():
            _warn_t = telegraph_time
            velocity.x = 0.0

func _find_player() -> Node3D:
    var list := get_tree().get_nodes_in_group("player")
    return list[0] if list.size() > 0 else null
