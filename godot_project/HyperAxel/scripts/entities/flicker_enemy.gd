extends PatrolEnemy

var bob_time: float = 0.0

func _ready() -> void:
	hp = 3
	speed = 55.0
	contact_damage = 2
	score_value = 100
	scrap_drop = 2
	family = "element"
	super._ready()

func _physics_process(delta: float) -> void:
	bob_time += delta
	# Flicker floats with a bob
	if alive and not is_on_floor():
		velocity.y = sin(bob_time * 3.0) * 30.0
	super._physics_process(delta)
