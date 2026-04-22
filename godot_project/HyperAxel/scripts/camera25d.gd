extends Camera3D
##
## Orthogonal side-scrolling camera that follows a target transform smoothly.
## Attach this script to the Camera3D inside your 2.5D level scene.
## Target is resolved via NodePath in `target_path` or auto-found by group "player".
##
## Settings recommended:
##   Projection: Orthogonal
##   Size: 8.0 (tune to frame ~14 world units wide)
##   Position: (0, 3, 10)   → z = 10 pulls camera back
##   Rotation: (0, 0, 0)    → pure side view
##
## For a subtle depth tilt, set rotation x to -8° (degrees) and leave orthogonal
## on. This keeps the side-scrolling look but adds real depth parallax.

@export var target_path   : NodePath
@export var follow_smooth : float = 6.0
@export var look_ahead_x  : float = 2.0
@export var offset        : Vector3 = Vector3(0.0, 2.0, 10.0)
@export var tilt_degrees  : float = -6.0   # slight downward tilt for 2.5D feel

var _target : Node3D = null

func _ready() -> void:
    projection = PROJECTION_ORTHOGONAL
    if size < 4.0:
        size = 8.0
    rotation_degrees.x = tilt_degrees
    rotation_degrees.y = 0.0
    rotation_degrees.z = 0.0
    if target_path != NodePath(""):
        _target = get_node_or_null(target_path)
    if _target == null:
        var pls := get_tree().get_nodes_in_group("player")
        if pls.size() > 0 and pls[0] is Node3D:
            _target = pls[0]

func _process(delta: float) -> void:
    if _target == null: return
    var desired : Vector3 = _target.global_position + offset
    # Lead the camera forward slightly based on player velocity if available.
    if _target is CharacterBody3D:
        desired.x += clampf((_target as CharacterBody3D).velocity.x * 0.12, -look_ahead_x, look_ahead_x)
    global_position = global_position.lerp(desired, clampf(follow_smooth * delta, 0.0, 1.0))
    # Keep Z constant — orthogonal camera doesn't care, but z dictates near/far.
    global_position.z = offset.z
