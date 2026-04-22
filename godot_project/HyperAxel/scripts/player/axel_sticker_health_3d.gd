extends Node
class_name AxelHealth25D
##
## 2.5D port of axel_sticker_health.gd.
## Tracks 3 sticker hearts with a chip-chip-chip-break chain for light hits.
## Parent: Axel CharacterBody3D (this node lives as a child).
##
## Use from AxelController3D when a hurt-box overlaps:
##     $Health.chip_sticker(true)   # heavy (full sticker)
##     $Health.chip_sticker(false)  # light (chip)
##
## Heart UI listens to `sticker_lost`, `sticker_chipped`, and `died` signals.

signal sticker_lost(remaining: int)
signal sticker_chipped(chip_level: int)
signal died()

@export var max_stickers       : int   = 3
@export var invincible_duration: float = 1.2

var stickers         : int   = 3
var chip_level       : int   = 0
var invincible       : bool  = false
var invincible_timer : float = 0.0

func _ready() -> void:
    stickers = max_stickers

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
        sticker_lost.emit(stickers)
    else:
        chip_level += 1
        if chip_level >= 3:
            stickers = max(0, stickers - 1)
            chip_level = 0
            sticker_lost.emit(stickers)
        else:
            sticker_chipped.emit(chip_level)

    if stickers <= 0:
        died.emit()

func heal() -> void:
    if stickers < max_stickers:
        stickers += 1
        chip_level = 0

func reset() -> void:
    stickers = max_stickers
    chip_level = 0
    invincible = false
    invincible_timer = 0.0
