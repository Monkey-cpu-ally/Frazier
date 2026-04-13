extends Area2D

# Hurtbox for Axel - detects enemy contact damage

func _ready() -> void:
	area_entered.connect(_on_area_entered)
	body_entered.connect(_on_body_entered)

func _on_area_entered(area: Area2D) -> void:
	_try_damage(area.get_parent())

func _on_body_entered(body: Node2D) -> void:
	_try_damage(body)

func _try_damage(source: Node2D) -> void:
	if source.has_method("get_contact_damage"):
		var dmg: int = source.get_contact_damage()
		var player := get_parent() as CharacterBody2D
		if player and player.has_method("take_damage"):
			player.take_damage(dmg, source.global_position)
