extends Area2D

# Hint prompt trigger - shows hint text when player enters

@export var hint_text: String = "Press DOWN + ATTACK in air to smash!"

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if body is AxelController:
		GameState.show_pickup(hint_text)
		FlightLog.add_entry(hint_text, "explore")
		queue_free()
