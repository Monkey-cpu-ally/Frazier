extends Area3D
class_name AxelAttackHitbox3D
##
## 2.5D attack hitbox — port of axel_attack_hitbox.gd.
## Parent node should be the Axel CharacterBody3D. On attack input, the hitbox
## toggles monitoring for `active_time` seconds while a CollisionShape3D child
## deals damage to any body in the "enemy" group.
##
## Scene shape:
##   Area3D  (this script, collision_layer = player_attack, collision_mask = enemy)
##   └── CollisionShape3D   (BoxShape3D ~1.2 × 0.9 × 0.6)
##
## Usage from AxelController3D:
##   if Input.is_action_just_pressed("attack"):
##       $AttackHitbox.strike(_facing)

@export var active_time : float = 0.18
@export var base_damage : int = 1
@export var combo_damage_mul : Array[float] = [1.0, 1.25, 1.75]   # weak/mid/heavy
@export var combo_window : float = 0.45
@export var knockback : Vector3 = Vector3(4.0, 2.5, 0.0)

var _timer : float = 0.0
var _combo : int = 0
var _combo_t : float = 0.0
var _facing : int = 1
var _already_hit : Array[Node] = []

func _ready() -> void:
    monitoring = false
    connect("body_entered", Callable(self, "_on_body_entered"))

func strike(facing: int) -> void:
    _facing = facing
    # combo chain up
    _combo = (_combo + 1) if _combo_t > 0.0 else 1
    if _combo > combo_damage_mul.size():
        _combo = 1
    _combo_t = combo_window
    _timer = active_time
    _already_hit.clear()
    # Flip hitbox along facing so it reaches in front
    position.x = 0.6 * facing
    monitoring = true

func _physics_process(delta: float) -> void:
    if _combo_t > 0.0:
        _combo_t = max(_combo_t - delta, 0.0)
        if _combo_t == 0.0: _combo = 0
    if _timer > 0.0:
        _timer -= delta
        if _timer <= 0.0:
            monitoring = false

func _on_body_entered(body: Node) -> void:
    if _already_hit.has(body): return
    if not body.is_in_group("enemy"): return
    _already_hit.append(body)
    var dmg : int = int(round(base_damage * combo_damage_mul[clampi(_combo - 1, 0, combo_damage_mul.size() - 1)]))
    if body.has_method("take_damage"):
        var push : Vector3 = Vector3(knockback.x * _facing, knockback.y, 0.0)
        body.take_damage(dmg, global_position, push)
