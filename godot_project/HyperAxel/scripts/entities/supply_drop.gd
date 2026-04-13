extends Node2D

# Supply drop - parachute delivery

var falling: bool = true
var fall_speed: float = 60.0

func _process(delta: float) -> void:
	if falling:
		position.y += fall_speed * delta
		if position.y > 300:
			falling = false
