extends CharacterBody2D

class_name PatrolEnemy

# Base patrol enemy with wall bounce + ledge detection

@export var speed: float = 80.0
@export var enemy_gravity: float = 1000.0
@export var move_left_first: bool = true
@export var hp: int = 2
@export var contact_damage: int = 1
@export var score_value: int = 50
@export var scrap_drop: int = 1
@export var family: String = "element"

@onready var ray_wall: RayCast2D = $RayWall
@onready var ray_floor: RayCast2D = $RayFloor
@onready var sprite_root: Node2D = $SpriteRoot
@onready var anim: AnimatedSprite2D = $SpriteRoot/AnimatedSprite2D

var direction: int = -1
var alive: bool = true
var hurt_timer: float = 0.0
var flash_timer: float = 0.0

signal defeated(enemy: PatrolEnemy)

func _ready() -> void:
	direction = -1 if move_left_first else 1
	update_visuals()

func _physics_process(delta: float) -> void:
	if not alive:
		return

	if hurt_timer > 0.0:
		hurt_timer -= delta
		return
	if flash_timer > 0.0:
		flash_timer -= delta

	if not is_on_floor():
		velocity.y += enemy_gravity * delta

	velocity.x = direction * speed

	if should_turn():
		direction *= -1
		update_visuals()

	move_and_slide()
	update_animation()

func should_turn() -> bool:
	if is_on_wall():
		return true
	if ray_floor and not ray_floor.is_colliding():
		return true
	return false

func update_visuals() -> void:
	if sprite_root:
		sprite_root.scale.x = abs(sprite_root.scale.x) * direction
	if ray_wall:
		if direction < 0:
			ray_wall.target_position.x = -abs(ray_wall.target_position.x)
		else:
			ray_wall.target_position.x = abs(ray_wall.target_position.x)
	if ray_floor:
		if direction < 0:
			ray_floor.target_position.x = -abs(ray_floor.target_position.x)
		else:
			ray_floor.target_position.x = abs(ray_floor.target_position.x)

func update_animation() -> void:
	if not anim:
		return
	if abs(velocity.x) > 1.0:
		anim.play("walk")
	else:
		anim.play("idle")

func get_contact_damage() -> int:
	return contact_damage

func take_hit(damage: int, from_pos: Vector2) -> void:
	if not alive:
		return
	hp -= damage
	hurt_timer = 0.12
	flash_timer = 0.12
	var knockback_dir := sign(global_position.x - from_pos.x)
	velocity.x = knockback_dir * 150.0
	velocity.y = -100.0

	if hp <= 0:
		alive = false
		GameState.add_score(score_value)
		GameState.scrap_meter = min(GameState.max_scrap, GameState.scrap_meter + scrap_drop * 8.0)
		FlightLog.add_entry("Defeated %s" % name, "combat")
		emit_signal("defeated", self)
		queue_free()
