extends CharacterBody2D

class_name AxelController

@export var move_speed: float = 220.0
@export var acceleration: float = 1400.0
@export var friction: float = 1800.0

@export var jump_force: float = -420.0
@export var gravity: float = 1200.0
@export var fall_gravity_multiplier: float = 1.35
@export var low_jump_gravity_multiplier: float = 1.8
@export var max_fall_speed: float = 900.0

@export var coyote_time: float = 0.12
@export var jump_buffer_time: float = 0.12

@export var wall_slide_speed: float = 120.0
@export var wall_jump_x: float = 280.0
@export var wall_jump_y: float = -360.0

@export var dash_speed: float = 520.0
@export var dash_time: float = 0.14
@export var dash_cooldown: float = 0.20

@export var attack_move_lock_time: float = 0.18

@onready var sprite: Node2D = $SpriteRoot
@onready var anim: AnimatedSprite2D = $SpriteRoot/AnimatedSprite2D
@onready var attack_pivot: Node2D = $AttackPivot
@onready var attack_hitbox: Area2D = $AttackPivot/AttackHitbox
@onready var hurtbox: Area2D = $Hurtbox
@onready var coyote_timer_node: Timer = $CoyoteTimer
@onready var jump_buffer_node: Timer = $JumpBufferTimer
@onready var health: Node = $StickerHealth

var input_direction: float = 0.0
var facing: int = 1

var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0

var is_dashing: bool = false
var can_dash: bool = true
var dash_timer: float = 0.0
var dash_cooldown_timer: float = 0.0
var dash_direction: int = 1

var is_attacking: bool = false
var attack_timer: float = 0.0
var combo_step: int = 0

var was_on_floor_last_frame: bool = false

signal attacked(hitbox_area: Area2D)
signal took_damage(amount: int)

func _physics_process(delta: float) -> void:
	read_input()
	update_timers(delta)

	if is_attacking:
		process_attack(delta)
	elif is_dashing:
		process_dash(delta)
	else:
		apply_horizontal_movement(delta)
		apply_gravity(delta)
		handle_jump()
		handle_wall_slide()
		handle_wall_jump()
		handle_dash_start()
		handle_attack_start()

	move_and_slide()
	update_floor_state()
	update_facing()
	update_animation()
	update_attack_pivot()

func read_input() -> void:
	input_direction = Input.get_axis("move_left", "move_right")
	if Input.is_action_just_pressed("jump"):
		jump_buffer_timer = jump_buffer_time

func update_timers(delta: float) -> void:
	if is_on_floor():
		coyote_timer = coyote_time
		can_dash = true
	else:
		coyote_timer = max(coyote_timer - delta, 0.0)
	jump_buffer_timer = max(jump_buffer_timer - delta, 0.0)
	if dash_cooldown_timer > 0.0:
		dash_cooldown_timer -= delta

func apply_horizontal_movement(delta: float) -> void:
	var target_speed := input_direction * move_speed
	if PowerManager.is_super_mode():
		target_speed *= 1.4
	if abs(target_speed) > 0.01:
		velocity.x = move_toward(velocity.x, target_speed, acceleration * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, friction * delta)

func apply_gravity(delta: float) -> void:
	if is_on_floor():
		return
	var applied_gravity := gravity
	if velocity.y > 0.0:
		applied_gravity *= fall_gravity_multiplier
	elif velocity.y < 0.0 and not Input.is_action_pressed("jump"):
		applied_gravity *= low_jump_gravity_multiplier
	velocity.y += applied_gravity * delta
	velocity.y = min(velocity.y, max_fall_speed)

func handle_jump() -> void:
	if jump_buffer_timer <= 0.0:
		return
	if is_on_floor() or coyote_timer > 0.0:
		var jump_mul := 1.15 if PowerManager.is_super_mode() else 1.0
		velocity.y = jump_force * jump_mul
		jump_buffer_timer = 0.0
		coyote_timer = 0.0

func handle_wall_slide() -> void:
	if is_on_floor():
		return
	if is_on_wall_only() and input_direction != 0.0 and velocity.y > 0.0:
		velocity.y = min(velocity.y, wall_slide_speed)

func handle_wall_jump() -> void:
	if not Input.is_action_just_pressed("jump"):
		return
	if is_on_floor():
		return
	if is_on_wall_only():
		var wall_normal := get_wall_normal()
		velocity.x = wall_normal.x * wall_jump_x
		velocity.y = wall_jump_y

func handle_dash_start() -> void:
	if not Input.is_action_just_pressed("dash"):
		return
	if not can_dash or dash_cooldown_timer > 0.0:
		return
	is_dashing = true
	can_dash = false
	dash_timer = dash_time
	if input_direction != 0.0:
		dash_direction = sign(input_direction)
	else:
		dash_direction = facing
	velocity = Vector2(dash_direction * dash_speed, 0.0)

func process_dash(delta: float) -> void:
	dash_timer -= delta
	velocity.x = dash_direction * dash_speed
	velocity.y = 0.0
	if dash_timer <= 0.0:
		is_dashing = false
		dash_cooldown_timer = dash_cooldown

func handle_attack_start() -> void:
	if not Input.is_action_just_pressed("attack"):
		return
	is_attacking = true
	attack_timer = attack_move_lock_time
	combo_step = 1 if combo_step == 0 else 2
	attack_hitbox.monitoring = true
	emit_signal("attacked", attack_hitbox)

func process_attack(delta: float) -> void:
	attack_timer -= delta
	velocity.x = move_toward(velocity.x, 0.0, friction * delta)
	apply_gravity(delta)
	if attack_timer <= 0.0:
		is_attacking = false
		attack_hitbox.monitoring = false
		if combo_step >= 2:
			combo_step = 0

func update_floor_state() -> void:
	was_on_floor_last_frame = is_on_floor()

func update_facing() -> void:
	if input_direction > 0.0:
		facing = 1
	elif input_direction < 0.0:
		facing = -1
	sprite.scale.x = abs(sprite.scale.x) * facing

func update_attack_pivot() -> void:
	attack_pivot.scale.x = facing

func update_animation() -> void:
	if is_attacking:
		if combo_step == 1:
			anim.play("attack_1")
		else:
			anim.play("attack_2")
		return
	if is_dashing:
		anim.play("dash")
		return
	if not is_on_floor():
		if is_on_wall_only() and velocity.y > 0.0:
			anim.play("wall_slide")
		elif velocity.y < 0.0:
			anim.play("jump")
		else:
			anim.play("fall")
		return
	if abs(velocity.x) > 15.0:
		anim.play("run")
	else:
		anim.play("idle")

func take_damage(amount: int, from_position: Vector2) -> void:
	if PowerManager.is_specter_mode():
		return
	var dir := sign(global_position.x - from_position.x)
	velocity.x = dir * 220.0
	velocity.y = -200.0
	health.chip_sticker(amount >= 2)
	emit_signal("took_damage", amount)
