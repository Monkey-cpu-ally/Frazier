extends Node2D

# Fox Spirit - appears after boss defeat, guides player

@export var path_points: PackedVector2Array = PackedVector2Array()

var visible_spirit: bool = false
var alpha: float = 0.0
var current_point: int = 0
var moving: bool = false
var move_speed: float = 100.0
var arrived: bool = false
var interactable: bool = false

func appear() -> void:
	visible_spirit = true
	alpha = 0.0
	FlightLog.add_entry("Spirit presence detected...", "explore")

func set_path(points: PackedVector2Array) -> void:
	path_points = points
	current_point = 0
	moving = true

func _process(delta: float) -> void:
	if not visible_spirit:
		return
	if alpha < 1.0:
		alpha = min(1.0, alpha + delta * 2.0)
	modulate.a = alpha * (0.7 + sin(Time.get_ticks_msec() * 0.003) * 0.2)

	if moving and path_points.size() > 0:
		var target := path_points[current_point]
		var dir := (target - Vector2(position.x, position.y)).normalized()
		var dist := position.distance_to(target)
		if dist < 5.0:
			current_point += 1
			if current_point >= path_points.size():
				moving = false
				arrived = true
				interactable = true
		else:
			position += dir * move_speed * delta
