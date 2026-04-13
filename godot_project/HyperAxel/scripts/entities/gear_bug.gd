extends PatrolEnemy

func _ready() -> void:
	hp = 2
	speed = 95.0
	contact_damage = 1
	score_value = 75
	scrap_drop = 1
	family = "machine"
	super._ready()
