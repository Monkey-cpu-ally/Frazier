extends "res://scripts/entities/enemy_base_3d.gd"
##
## GearBug 2.5D — personality: HOPS every 0.65-1.0s while grounded.
## Override: `_ai()` adds a pop-jump and small forward lunge.

@export var hop_interval : Vector2 = Vector2(0.65, 1.0)
@export var hop_strength : float = 7.5
@export var hop_lunge_mul : float = 1.35

var _hop_t : float = 0.6

func _ai(delta: float) -> void:
    super._ai(delta)
    _hop_t -= delta
    if _hop_t <= 0.0 and is_on_floor():
        _hop_t = randf_range(hop_interval.x, hop_interval.y)
        velocity.y = hop_strength
        velocity.x *= hop_lunge_mul
