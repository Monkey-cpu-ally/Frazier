extends Node2D

# Fighter plane assist power

var active: bool = false
var fly_speed: float = 400.0
var direction: int = 1

func activate(dir: int) -> void:
	active = true
	direction = dir
	visible = true

func _process(delta: float) -> void:
	if active:
		position.x += direction * fly_speed * delta
