extends Node2D

# Game root - level setup and seeded world notes

func _ready() -> void:
	GameState.reset()
	FlightLog.add_entry("System boot. Scanning sector...", "system")
