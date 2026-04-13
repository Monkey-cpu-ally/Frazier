extends PatrolEnemy

func _ready() -> void:
	hp = 5
	speed = 35.0
	contact_damage = 2
	score_value = 200
	scrap_drop = 3
	family = "machine"
	super._ready()
