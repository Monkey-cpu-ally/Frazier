extends Node2D

# Scrap assist actor - Scrap's physical appearance for assist actions

func _ready() -> void:
	pass

func drop_bag(target_pos: Vector2) -> void:
	var drop_point: Marker2D = $BagDropPoint
	if drop_point:
		drop_point.global_position = target_pos
	$Timer.start()
