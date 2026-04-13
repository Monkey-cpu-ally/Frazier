extends Area2D

# Reusable pickup item for coins, scrap, food, and powers

@export var pickup_type: String = "coin"  # coin, scrap, food, power
@export var amount: int = 1
@export var power_name: String = ""

var collected: bool = false

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node2D) -> void:
	if collected:
		return
	if not body is AxelController:
		return
	collected = true
	match pickup_type:
		"coin":
			GameState.add_coin(amount)
		"scrap":
			GameState.add_scrap(amount)
		"food":
			GameState.add_food()
			if body.has_node("StickerHealth"):
				body.get_node("StickerHealth").heal()
		"power":
			if power_name != "":
				PowerManager.activate(power_name)
				GameState.show_pickup("Power: %s" % power_name.replace("_", " ").to_upper())
				FlightLog.add_entry("Activated %s" % power_name.replace("_", " "), "power")
	queue_free()
