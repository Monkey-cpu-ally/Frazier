extends Area2D

# Boss start trigger - activates boss fight when player enters

signal boss_triggered()

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if body is AxelController:
		emit_signal("boss_triggered")
		queue_free()
