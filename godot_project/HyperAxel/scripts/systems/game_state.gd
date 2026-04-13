extends Node

# Global game state autoload

signal coins_changed(total: int)
signal scrap_changed(total: int)
signal pickup_text_shown(text: String)

var stickers: int = 3
var coins: int = 0
var scrap_parts: int = 0
var scrap_meter: float = 0.0
var max_scrap: float = 100.0
var score: int = 0
var pickup_text: String = ""
var pickup_timer: float = 0.0

func _process(delta: float) -> void:
	if pickup_timer > 0.0:
		pickup_timer -= delta

func reset() -> void:
	stickers = 3
	coins = 0
	scrap_parts = 0
	scrap_meter = 0.0
	score = 0

func add_coin(amount: int = 1) -> void:
	coins += amount
	score += 10 * amount
	show_pickup("+%d Coin" % amount)
	emit_signal("coins_changed", coins)

func add_scrap(amount: int = 1) -> void:
	scrap_parts += amount
	scrap_meter = min(max_scrap, scrap_meter + amount * 12.0)
	show_pickup("+%d Scrap" % amount)
	emit_signal("scrap_changed", scrap_parts)

func add_food() -> void:
	show_pickup("Health restored!")

func add_score(amount: int) -> void:
	score += amount

func spend_scrap(cost: float) -> bool:
	if scrap_meter >= cost:
		scrap_meter -= cost
		return true
	return false

func show_pickup(text: String) -> void:
	pickup_text = text
	pickup_timer = 1.5
	emit_signal("pickup_text_shown", text)
