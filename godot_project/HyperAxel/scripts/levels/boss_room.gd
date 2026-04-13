extends Node2D

# Boss room script - manages Rootbound Siege Tank encounter

@onready var boss: Node2D = $RootboundSiegeTank
@onready var exit_blocker: StaticBody2D = $ExitBlocker
@onready var fox_spirit: Node2D = $FoxSpirit

var boss_active: bool = false
var boss_defeated: bool = false

func _ready() -> void:
	FlightLog.add_entry("Entering: Siege Core", "nav")
	var trigger: Area2D = $BossStartTrigger
	if trigger:
		trigger.boss_triggered.connect(_on_boss_triggered)

func _on_boss_triggered() -> void:
	boss_active = true
	if boss:
		boss.visible = true
	FlightLog.add_entry("WARNING: Siege Tank detected", "combat")

func _process(_delta: float) -> void:
	if boss_active and boss and not boss_defeated:
		if not boss.visible:
			boss_defeated = true
			_on_boss_defeated()

func _on_boss_defeated() -> void:
	if exit_blocker:
		exit_blocker.queue_free()
	if fox_spirit:
		fox_spirit.appear()
	FlightLog.add_entry("Siege Tank neutralized", "combat")
