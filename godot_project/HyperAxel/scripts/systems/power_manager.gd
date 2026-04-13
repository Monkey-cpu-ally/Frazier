extends Node

# Power manager autoload - one active power at a time, 15s duration

signal power_activated(power_id: String)
signal power_expired()

var powers: Dictionary = {
	"burning_buffalo": {"name": "Burning Buffalo", "color": Color(0.99, 0.55, 0.35), "duration": 15.0},
	"shadow_tag": {"name": "Shadow Tag", "color": Color(0.545, 0.361, 0.965), "duration": 15.0},
	"golden_gloves": {"name": "Golden Gloves", "color": Color(1.0, 0.843, 0.0), "duration": 15.0},
	"super_mode": {"name": "Super Mode", "color": Color(1.0, 0.267, 0.267), "duration": 15.0},
	"specter_mode": {"name": "Specter Mode", "color": Color(0.533, 0.867, 1.0), "duration": 15.0},
	"fighter_plane": {"name": "Fighter Plane", "color": Color(0.267, 0.733, 0.267), "duration": 15.0},
}

var active_power: String = ""
var timer: float = 0.0

func _process(delta: float) -> void:
	if active_power != "":
		timer -= delta
		if timer <= 0.0:
			active_power = ""
			timer = 0.0
			emit_signal("power_expired")

func activate(power_id: String) -> void:
	if power_id not in powers:
		return
	active_power = power_id
	timer = powers[power_id]["duration"]
	emit_signal("power_activated", power_id)

func is_active() -> bool:
	return active_power != ""

func is_burning_buffalo() -> bool:
	return active_power == "burning_buffalo"

func is_golden_gloves() -> bool:
	return active_power == "golden_gloves"

func is_super_mode() -> bool:
	return active_power == "super_mode"

func is_specter_mode() -> bool:
	return active_power == "specter_mode"

func is_shadow_tag() -> bool:
	return active_power == "shadow_tag"

func is_fighter_plane() -> bool:
	return active_power == "fighter_plane"

func get_color() -> Color:
	if active_power in powers:
		return powers[active_power]["color"]
	return Color.WHITE

func reset() -> void:
	active_power = ""
	timer = 0.0
