extends PatrolEnemy

func _ready() -> void:
	hp = 2
	speed = 65.0
	contact_damage = 1
	score_value = 50
	scrap_drop = 1
	family = "dinosaur"
	super._ready()
