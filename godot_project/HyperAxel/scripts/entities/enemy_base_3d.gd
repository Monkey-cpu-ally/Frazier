extends CharacterBody3D
class_name Enemy3D
##
## Base class for 2.5D enemies. Mirrors enemies.js EnemyBase.
## Subclasses override `_ai(delta)` to implement personality.
## Handles gravity, take_damage, smoke-puff death.
##
## Expected scene:
##   CharacterBody3D (this script, collision_layer=enemy, mask=world)
##   ├── CollisionShape3D (capsule, size matches sprite)
##   └── Sprite3D (billboard_y, texture set per type)

@export var max_hp      : int   = 2
@export var speed       : float = 2.2
@export var patrol      : float = 4.0     # world units wander range
@export var damage      : int   = 1
@export var gravity     : float = 32.0
@export var max_fall    : float = 18.0
@export var sprite_path : NodePath = NodePath("Sprite3D")

var hp        : int
var origin_x  : float
var dir       : int = 1
var state     : String = "patrol"
var alive     : bool = true
var hurt_t    : float = 0.0
var flash_t   : float = 0.0
var anim_t    : float = 0.0

@onready var _sprite : Sprite3D = get_node_or_null(sprite_path)

func _ready() -> void:
    hp = max_hp
    origin_x = global_position.x
    add_to_group("enemy")

func _physics_process(delta: float) -> void:
    if not alive: return
    anim_t += delta
    if hurt_t > 0.0: hurt_t -= delta
    if flash_t > 0.0: flash_t -= delta
    _ai(delta)
    # Gravity + motion
    velocity.y = max(velocity.y - gravity * delta, -max_fall)
    global_position.z = 0.0                 # lock to 2.5D plane
    move_and_slide()
    if _sprite:
        _sprite.scale.x = dir
        _sprite.modulate = Color(1.5, 0.8, 0.8) if flash_t > 0.0 else Color(1, 1, 1)

func _ai(_delta: float) -> void:
    # Default: patrol within range of origin.
    velocity.x = dir * speed
    if abs(global_position.x - origin_x) > patrol:
        dir = -dir

func take_damage(amount: int, from_pos: Vector3, knockback: Vector3) -> void:
    if not alive: return
    hp -= amount
    flash_t = 0.12
    hurt_t = 0.15
    velocity = Vector3(sign(global_position.x - from_pos.x) * knockback.x,
                       knockback.y, 0.0)
    if hp <= 0:
        _die()

func _die() -> void:
    alive = false
    _spawn_smoke_poof()
    queue_free()

func _spawn_smoke_poof() -> void:
    # Lightweight smoke burst using CPUParticles3D.
    var parts := CPUParticles3D.new()
    parts.emitting = true
    parts.one_shot = true
    parts.amount = 14
    parts.lifetime = 0.6
    parts.explosiveness = 0.9
    parts.spread = 180.0
    parts.initial_velocity_min = 2.0
    parts.initial_velocity_max = 4.5
    parts.scale_amount_min = 0.3
    parts.scale_amount_max = 0.6
    parts.gravity = Vector3(0, 1.5, 0)                # drift up
    parts.color = Color(0.9, 0.9, 0.9, 1.0)
    parts.global_position = global_position + Vector3(0, 0.6, 0)
    get_tree().current_scene.add_child(parts)
    # Auto-cleanup after lifetime
    await get_tree().create_timer(1.0).timeout
    if is_instance_valid(parts):
        parts.queue_free()
