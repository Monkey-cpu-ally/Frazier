extends CharacterBody3D
class_name Axel25D
##
## 2.5D port of axel_movement.gd — Z-locked CharacterBody3D controller.
## All the feel constants below mirror the HTML5 + Godot 2D builds tick-for-tick
## so the jump arc, dash, coyote time, and buffer feel identical.
##
## Expected scene shape:
##   CharacterBody3D (this script)
##   ├── CollisionShape3D (CapsuleShape3D 0.4 radius, 1.4 height)
##   ├── Sprite3D  (billboard mode enabled, pixel-art face texture)
##   ├── GroundCheck (Node3D at -0.9 y) — optional, used by RayCast3D child
##   └── RayCast3D (pointing -Y, length 0.25) — for ground probe

# ── Physics ──────────────────────────────────────────────────────
@export var move_speed       : float = 6.5        # world units/sec
@export var jump_velocity    : float = 11.0
@export var gravity          : float = 32.0
@export var fall_gravity_mul : float = 1.8
@export var low_jump_mul     : float = 2.2
@export var max_fall         : float = 18.0
@export var coyote_time      : float = 0.12
@export var jump_buffer      : float = 0.12
@export var dash_duration    : float = 0.18
@export var dash_speed       : float = 14.5
@export var dash_cooldown    : float = 0.6
@export var wall_slide_speed : float = 1.8
@export var wall_jump        : Vector2 = Vector2(8.0, 10.0)

# ── State ────────────────────────────────────────────────────────
var _coyote : float = 0.0
var _buffer : float = 0.0
var _dash_t : float = 0.0
var _cd_t   : float = 0.0
var _facing : int   = 1
var _can_dash : bool = true
var _prev_grounded : bool = false

@onready var _sprite : Sprite3D = $Sprite3D if has_node("Sprite3D") else null

func _physics_process(delta: float) -> void:
    # Lock Z to keep it on the 2.5D plane
    global_position.z = 0.0

    # Contact damage — any enemy in the body_shape_cast will chip a sticker.
    _apply_contact_damage()

    var input_x : float = Input.get_axis("move_left", "move_right")
    if input_x != 0.0:
        _facing = int(sign(input_x))

    # Attack input → trigger hitbox
    if Input.is_action_just_pressed("attack"):
        var hb := get_node_or_null("AttackHitbox")
        if hb and hb.has_method("strike"):
            hb.strike(_facing)

    # Coyote + buffer timers
    var grounded := is_on_floor()
    if grounded:
        _coyote = coyote_time
        _can_dash = true
    else:
        _coyote = max(_coyote - delta, 0.0)

    if Input.is_action_just_pressed("jump"):
        _buffer = jump_buffer
    else:
        _buffer = max(_buffer - delta, 0.0)

    _cd_t = max(_cd_t - delta, 0.0)

    # Dash
    if Input.is_action_just_pressed("dash") and _can_dash and _cd_t <= 0.0:
        _dash_t = dash_duration
        _cd_t   = dash_cooldown
        _can_dash = false
    if _dash_t > 0.0:
        _dash_t -= delta
        velocity.x = _facing * dash_speed
        velocity.y = 0.0
        _apply_motion(delta)
        _update_sprite()
        return

    # Horizontal
    var target_vx : float = input_x * move_speed
    velocity.x = lerp(velocity.x, target_vx, 0.35)

    # Gravity (variable jump height — snappier falls)
    var g : float = gravity
    if velocity.y > 0.0 and not Input.is_action_pressed("jump"):
        g *= low_jump_mul
    elif velocity.y < 0.0:
        g *= fall_gravity_mul
    velocity.y -= g * delta
    velocity.y = clampf(velocity.y, -max_fall * gravity * 0.0 - 100.0, max_fall * 3.0)

    # Jump (with coyote & buffer)
    if _buffer > 0.0 and (_coyote > 0.0):
        velocity.y = jump_velocity
        _buffer = 0.0
        _coyote = 0.0

    # Wall-jump (simplified: detect horizontal collision)
    if not grounded and is_on_wall() and Input.is_action_just_pressed("jump"):
        var n : Vector3 = get_wall_normal()
        velocity.x = sign(n.x) * wall_jump.x
        velocity.y = wall_jump.y
        _facing = int(sign(n.x))

    # Wall slide clamp
    if not grounded and is_on_wall() and velocity.y < -wall_slide_speed:
        velocity.y = -wall_slide_speed

    _apply_motion(delta)
    _update_sprite()
    _prev_grounded = grounded

func _apply_motion(delta: float) -> void:
    move_and_slide()

func _update_sprite() -> void:
    if _sprite == null: return
    # Flip sprite by scaling X; billboard keeps it facing the camera.
    _sprite.scale.x = _facing

# Contact damage — scan enemies near the player using move_and_slide's last collisions.
# Also supports Mario stomp: falling onto an enemy's head takes them out + bounces.
func _apply_contact_damage() -> void:
    var health := get_node_or_null("Health")
    if health == null: return
    for i in range(get_slide_collision_count()):
        var col := get_slide_collision(i)
        var body := col.get_collider()
        if body == null or not body.is_in_group("enemy"): continue
        var n := col.get_normal()
        # If we're coming down onto the top of the enemy, it's a stomp.
        if n.y > 0.55 and velocity.y <= 0.0:
            if body.has_method("take_damage"):
                body.take_damage(99, global_position, Vector3(0, 0, 0))
            velocity.y = 9.5 if Input.is_action_pressed("jump") else 6.5
        else:
            health.chip_sticker(false)
            # Knockback
            velocity = Vector3(sign(global_position.x - body.global_position.x) * 5.0, 4.0, 0.0)
