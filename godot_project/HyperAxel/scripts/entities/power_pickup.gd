extends Area2D

# Power pickup orb

@export var power_type: int = 1
@export var power_id: String = "burning_buffalo"
@export var duration: float = 15.0

var collected: bool = false

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if collected or not body is AxelController:
		return
	collected = true
	PowerManager.activate(power_id)
	GameState.show_pickup("Power: %s" % power_id.replace("_", " ").to_upper())
	FlightLog.add_entry("Activated %s" % power_id.replace("_", " "), "power")
	queue_free()
