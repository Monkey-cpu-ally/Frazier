extends CanvasLayer

# HUD - sticker health, coins, scrap meter, power icon + timer, pickup text

@onready var sticker_container: HBoxContainer = $StickerContainer
@onready var coin_label: Label = $CoinLabel
@onready var scrap_bar: ProgressBar = $ScrapBar
@onready var score_label: Label = $ScoreLabel
@onready var power_icon: TextureRect = $PowerIcon
@onready var power_timer_label: Label = $PowerTimerLabel
@onready var pickup_label: Label = $PickupLabel

func _ready() -> void:
	GameState.coins_changed.connect(_on_coins_changed)
	GameState.pickup_text_shown.connect(_on_pickup_shown)
	PowerManager.power_activated.connect(_on_power_activated)
	PowerManager.power_expired.connect(_on_power_expired)

func _process(_delta: float) -> void:
	if scrap_bar:
		scrap_bar.value = GameState.scrap_meter
	if score_label:
		score_label.text = "Score: %d" % GameState.score
	if PowerManager.is_active() and power_timer_label:
		power_timer_label.text = "%ds" % ceili(PowerManager.timer)
		power_timer_label.visible = true
	elif power_timer_label:
		power_timer_label.visible = false
	if pickup_label:
		if GameState.pickup_timer > 0.0:
			pickup_label.text = GameState.pickup_text
			pickup_label.modulate.a = min(1.0, GameState.pickup_timer)
		else:
			pickup_label.text = ""

func _on_coins_changed(total: int) -> void:
	if coin_label:
		coin_label.text = "x %d" % total

func _on_pickup_shown(text: String) -> void:
	if pickup_label:
		pickup_label.text = text

func _on_power_activated(power_id: String) -> void:
	if power_icon:
		power_icon.visible = true

func _on_power_expired() -> void:
	if power_icon:
		power_icon.visible = false
