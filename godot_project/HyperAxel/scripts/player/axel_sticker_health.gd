extends Node

# Sticker-based health system
# Light hits chip the current sticker, heavy hits remove a full sticker

signal sticker_lost(remaining: int)
signal sticker_chipped(chip_level: int)
signal died()

@export var max_stickers: int = 3

var stickers: int = 3
var chip_level: int = 0
var invincible: bool = false
var invincible_timer: float = 0.0
var invincible_duration: float = 1.2

func _process(delta: float) -> void:
	if invincible:
		invincible_timer -= delta
		if invincible_timer <= 0.0:
			invincible = false

func chip_sticker(heavy: bool = false) -> void:
	if invincible:
		return
	invincible = true
	invincible_timer = invincible_duration

	if heavy:
		stickers = max(0, stickers - 1)
		chip_level = 0
		emit_signal("sticker_lost", stickers)
	else:
		chip_level += 1
		if chip_level >= 3:
			stickers = max(0, stickers - 1)
			chip_level = 0
			emit_signal("sticker_lost", stickers)
		else:
			emit_signal("sticker_chipped", chip_level)

	if stickers <= 0:
		emit_signal("died")

func heal() -> void:
	if stickers < max_stickers:
		stickers += 1
		chip_level = 0

func reset() -> void:
	stickers = max_stickers
	chip_level = 0
	invincible = false
