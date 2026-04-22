extends Area3D
class_name Pickup25D
##
## 2.5D port of pickup_item.gd — coin / scrap / food / power.
## On Player overlap: updates HUD25D, heals player (food), or triggers power
## (power_name = 'super' | 'hyper' | 'shadow' | 'burning' | 'specter' | etc).
##
## Scene recipe:
##   Area3D (this script, collision_layer=0, mask=player)
##   ├── CollisionShape3D (SphereShape3D 0.35)
##   └── Sprite3D  (billboard, texture = coin/scrap/food/power sprite)
##
## The HUD is auto-resolved from the "hud" group. Tag your HUD CanvasLayer:
##   HUD.add_to_group("hud")       # done automatically in HUD25D._ready()

@export_enum("coin", "scrap", "food", "power") var pickup_type: String = "coin"
@export var amount: int = 1
@export var power_name: String = ""
@export var bob_amplitude : float = 0.1
@export var bob_speed     : float = 2.5
@export var spin_speed    : float = 2.0

var collected : bool = false
var _base_y   : float = 0.0
var _t        : float = 0.0

@onready var _sprite : Sprite3D = get_node_or_null("Sprite3D")

func _ready() -> void:
    _base_y = global_position.y
    # Random phase so adjacent pickups aren't lock-stepped.
    _t = randf() * TAU
    body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
    if collected: return
    _t += delta
    # Idle bob + slow flip
    global_position.y = _base_y + sin(_t * bob_speed) * bob_amplitude
    if _sprite:
        _sprite.scale.x = cos(_t * spin_speed)     # gives a paper-thin spin look

func _on_body_entered(body: Node) -> void:
    if collected: return
    if not body.is_in_group("player"): return
    collected = true
    var hud := _find_hud()
    match pickup_type:
        "coin":
            if hud:
                hud.add_coins(amount)
                hud.add_score(10 * amount)
        "scrap":
            if hud:
                hud.add_score(25 * amount)
                hud.show_pickup("+%d SCRAP" % amount)
        "food":
            var health := body.get_node_or_null("Health")
            if health and health.has_method("heal"):
                health.heal()
            if hud: hud.show_pickup("HEAL")
        "power":
            if hud: hud.show_pickup("POWER: %s" % power_name.replace("_", " ").to_upper())
            # TODO: wire to a PowerManager25D when ported.
    _spawn_pickup_sparkle()
    queue_free()

func _find_hud() -> Node:
    var list := get_tree().get_nodes_in_group("hud")
    return list[0] if list.size() > 0 else null

func _spawn_pickup_sparkle() -> void:
    var parts := CPUParticles3D.new()
    parts.emitting = true
    parts.one_shot = true
    parts.amount = 10
    parts.lifetime = 0.5
    parts.explosiveness = 0.9
    parts.spread = 180.0
    parts.initial_velocity_min = 2.0
    parts.initial_velocity_max = 4.0
    parts.scale_amount_min = 0.15
    parts.scale_amount_max = 0.3
    parts.gravity = Vector3(0, -2.0, 0)
    parts.color = Color(1.0, 0.86, 0.38, 1.0) if pickup_type == "coin" else Color(0.85, 1.0, 0.75, 1.0)
    parts.global_position = global_position
    get_tree().current_scene.add_child(parts)
    await get_tree().create_timer(0.8).timeout
    if is_instance_valid(parts):
        parts.queue_free()
