extends Node2D

# Room 5 - Boss arena with gates and fight trigger

@onready var boss_gate: StaticBody2D = $BossGate
@onready var exit_gate: StaticBody2D = $ExitGate
@onready var boss_placeholder: Node2D = $BossPlaceholder
@onready var arena_label: Label = $ArenaStateLabel

var fight_started: bool = false
var fight_won: bool = false

func _ready() -> void:
	FlightLog.add_entry("Entering: Boss Arena", "nav")
	var trigger: Area2D = $FightTrigger
	if trigger:
		trigger.body_entered.connect(_on_fight_trigger)

func _on_fight_trigger(body: Node2D) -> void:
	if body is AxelController and not fight_started:
		fight_started = true
		if boss_placeholder:
			boss_placeholder.visible = true
		if arena_label:
			arena_label.text = "FIGHT!"
		FlightLog.add_entry("Arena locked! Defeat the enemy!", "combat")

func _process(_delta: float) -> void:
	if fight_started and not fight_won:
		if boss_placeholder and not is_instance_valid(boss_placeholder):
			fight_won = true
			_on_fight_won()

func _on_fight_won() -> void:
	if exit_gate:
		exit_gate.queue_free()
	if arena_label:
		arena_label.text = "Arena cleared!"
	FlightLog.add_entry("Arena unlocked!", "combat")
