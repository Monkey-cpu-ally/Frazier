extends Area2D

# Attack hitbox for Axel's wrench swings

signal hit_enemy(enemy: Node2D)

var damage: int = 1
var is_heavy: bool = false

func _ready() -> void:
	monitoring = false
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)

func _on_body_entered(body: Node2D) -> void:
	if body.has_method("take_hit"):
		var dmg := damage
		if PowerManager.is_golden_gloves():
			dmg *= 2
		elif PowerManager.is_super_mode():
			dmg = ceili(dmg * 1.5)
		body.take_hit(dmg, global_position)
		emit_signal("hit_enemy", body)

func _on_area_entered(area: Area2D) -> void:
	if area.get_parent().has_method("take_hit"):
		var dmg := damage
		if PowerManager.is_golden_gloves():
			dmg *= 2
		area.get_parent().take_hit(dmg, global_position)
