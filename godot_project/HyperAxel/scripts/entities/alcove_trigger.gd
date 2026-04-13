extends Area2D

# Alcove trigger - for fox alcove discovery

signal alcove_discovered()

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if body is AxelController:
		FlightLog.add_entry("Hidden alcove discovered", "explore")
		emit_signal("alcove_discovered")
		queue_free()
