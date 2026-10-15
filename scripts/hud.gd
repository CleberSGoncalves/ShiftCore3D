extends CanvasLayer
## HUD — Interface responsiva do ShiftCore3D
## Suporta Desktop e Touch mobile | EN e PT-BR | Sem sobreposições

# ══════════════════════════════════════════════════════════
# NODOS HUD (mapeados em hud.tscn)
# ══════════════════════════════════════════════════════════
@onready var score_label: Label = $TopBar/ScoreLabel
@onready var health_bar: ProgressBar = $TopBar/HealthBar
@onready var cores_label: Label = $TopBar/CoresLabel
@onready var gravity_label: Label = $TopBar/GravityLabel
@onready var sector_label: Label = $TopBar/SectorLabel

# Painéis de estado
@onready var game_over_panel: Control = $GameOverPanel
@onready var victory_panel: Control = $VictoryPanel
@onready var pause_panel: Control = $PausePanel
@onready var lore_panel: Control = $LorePanel
@onready var ad_panel: Control = $AdPanel

# Game Over
@onready var go_label: Label = $GameOverPanel/VBox/TitleLabel
@onready var go_score_label: Label = $GameOverPanel/VBox/ScoreLabel
@onready var revive_button: Button = $GameOverPanel/VBox/ReviveButton
@onready var restart_button: Button = $GameOverPanel/VBox/RestartButton

# Victory
@onready var vic_label: Label = $VictoryPanel/VBox/TitleLabel
@onready var vic_score_label: Label = $VictoryPanel/VBox/ScoreLabel
@onready var double_button: Button = $VictoryPanel/VBox/DoubleButton
@onready var next_button: Button = $VictoryPanel/VBox/NextButton

# Pause
@onready var pause_label: Label = $PausePanel/VBox/TitleLabel
@onready var resume_button: Button = $PausePanel/VBox/ResumeButton

# Lore
@onready var lore_title: Label = $LorePanel/VBox/TitleLabel
@onready var lore_body: Label = $LorePanel/VBox/BodyLabel
@onready var skip_button: Button = $LorePanel/SkipButton

# Touch controls (visíveis apenas em touch)
@onready var touch_controls: Control = $TouchControls

# ══════════════════════════════════════════════════════════
# ESTADO
# ══════════════════════════════════════════════════════════
var _lore_page: int = 0
const LORE_PAGES: int = 3
var _double_reward_used: bool = false

# ══════════════════════════════════════════════════════════
func _ready() -> void:
	_connect_signals()
	_apply_locale()
	_hide_all_panels()
	_detect_touch()
	# Inicia na lore screen após boot/intro
	call_deferred("_show_lore")

func _apply_locale() -> void:
	if not LocaleManager: return
	sector_label.text = LocaleManager.t("sector") + " 1"
	score_label.text = LocaleManager.t("score") + ": 0"
	cores_label.text = LocaleManager.t("energy_cores") + ": 0/0"
	gravity_label.text = LocaleManager.t("gravity_dir") + " Down"
	go_label.text = LocaleManager.t("game_over")
	revive_button.text = LocaleManager.t("revive")
	restart_button.text = LocaleManager.t("restart")
	vic_label.text = LocaleManager.t("victory")
	double_button.text = LocaleManager.t("double_reward")
	next_button.text = LocaleManager.t("next_level")
	pause_label.text = LocaleManager.t("pause")
	resume_button.text = LocaleManager.t("resume")
	skip_button.text = "▶ " + LocaleManager.t("skip")
	lore_title.text = LocaleManager.t("lore_title")

func _detect_touch() -> void:
	if DisplayServer.is_touchscreen_available() or OS.get_name() == "Android" or OS.get_name() == "iOS":
		touch_controls.visible = true
	else:
		touch_controls.visible = false

# ══════════════════════════════════════════════════════════
# CONECTAR SINAIS
# ══════════════════════════════════════════════════════════
func _connect_signals() -> void:
	if GameManager:
		GameManager.score_changed.connect(_on_score_changed)
		GameManager.health_changed.connect(_on_health_changed)
		GameManager.energy_core_collected.connect(_on_cores_changed)
		GameManager.gravity_changed.connect(_on_gravity_changed)
		GameManager.game_over.connect(_on_game_over)
		GameManager.level_completed.connect(_on_level_completed)
	if CrazySDK:
		CrazySDK.rewarded_granted.connect(_on_rewarded_granted)
		CrazySDK.ad_started.connect(_on_ad_started)
		CrazySDK.ad_finished.connect(_on_ad_finished)

# ══════════════════════════════════════════════════════════
# ATUALIZAR DISPLAYS
# ══════════════════════════════════════════════════════════
func _on_score_changed(new_score: int) -> void:
	score_label.text = LocaleManager.t("score") + ": %d" % new_score

func _on_health_changed(new_health: int) -> void:
	health_bar.value = float(new_health)

func _on_cores_changed(total: int) -> void:
	var max_cores := GameManager.energy_cores_total if GameManager else 0
	cores_label.text = LocaleManager.t("energy_cores") + ": %d/%d" % [total, max_cores]

func _on_gravity_changed(_dir: Vector3) -> void:
	if GameManager:
		gravity_label.text = LocaleManager.t("gravity_dir") + " " + GameManager.get_gravity_name()

# ══════════════════════════════════════════════════════════
# LORE SCREEN (máximo 1 clique para entrar na gameplay)
# ══════════════════════════════════════════════════════════
func _show_lore() -> void:
	lore_panel.visible = true
	_update_lore_page()

func _update_lore_page() -> void:
	var key := "lore_%d" % (_lore_page + 1)
	lore_body.text = LocaleManager.t(key)

func _on_lore_next_pressed() -> void:
	AudioManager.play_ui_click()
	_lore_page += 1
	if _lore_page >= LORE_PAGES:
		_enter_gameplay()
	else:
		_update_lore_page()

func _on_skip_pressed() -> void:
	AudioManager.play_ui_click()
	_enter_gameplay()

func _enter_gameplay() -> void:
	lore_panel.visible = false
	if GameManager:
		GameManager.start_new_game()

# ══════════════════════════════════════════════════════════
# GAME OVER
# ══════════════════════════════════════════════════════════
func _on_game_over() -> void:
	game_over_panel.visible = true
	go_score_label.text = LocaleManager.t("score") + ": %d" % GameManager.score
	# Botão reviver: visível apenas se ainda pode reviver
	revive_button.visible = GameManager.can_revive

# ══════════════════════════════════════════════════════════
# VITÓRIA
# ══════════════════════════════════════════════════════════
func _on_level_completed(_level: int) -> void:
	victory_panel.visible = true
	vic_score_label.text = LocaleManager.t("score") + ": %d" % GameManager.score
	_double_reward_used = false
	double_button.visible = true
	double_button.disabled = false
	sector_label.text = LocaleManager.t("sector") + " %d" % GameManager.current_level

# ══════════════════════════════════════════════════════════
# BOTÕES DE GAME OVER
# ══════════════════════════════════════════════════════════
func _on_revive_button_pressed() -> void:
	AudioManager.play_ui_click()
	revive_button.disabled = true
	if GameManager:
		GameManager.request_revive()

func _on_restart_button_pressed() -> void:
	AudioManager.play_ui_click()
	game_over_panel.visible = false
	get_tree().reload_current_scene()

# ══════════════════════════════════════════════════════════
# BOTÕES DE VITÓRIA
# ══════════════════════════════════════════════════════════
func _on_double_button_pressed() -> void:
	AudioManager.play_ui_click()
	double_button.disabled = true
	if GameManager:
		GameManager.request_double_reward()

func _on_next_button_pressed() -> void:
	AudioManager.play_ui_click()
	victory_panel.visible = false
	if GameManager:
		GameManager.advance_level()
		get_tree().reload_current_scene()

# ══════════════════════════════════════════════════════════
# PAUSE
# ══════════════════════════════════════════════════════════
func _on_resume_button_pressed() -> void:
	AudioManager.play_ui_click()
	pause_panel.visible = false
	if GameManager:
		GameManager.resume_game()

# ══════════════════════════════════════════════════════════
# AD PANEL
# ══════════════════════════════════════════════════════════
func _on_ad_started() -> void:
	ad_panel.visible = true

func _on_ad_finished() -> void:
	ad_panel.visible = false

func _on_rewarded_granted() -> void:
	# Se estava aguardando double reward, oculta botão
	if not _double_reward_used:
		_double_reward_used = true
		double_button.visible = false
	game_over_panel.visible = false

# ══════════════════════════════════════════════════════════
# TOUCH — BOTÕES DE GRAVIDADE
# ══════════════════════════════════════════════════════════
func _on_touch_up_pressed() -> void:
	GameManager.flip_gravity(Vector3.UP)
func _on_touch_down_pressed() -> void:
	GameManager.flip_gravity(Vector3.DOWN)
func _on_touch_left_pressed() -> void:
	GameManager.flip_gravity(Vector3.LEFT)
func _on_touch_right_pressed() -> void:
	GameManager.flip_gravity(Vector3.RIGHT)
func _on_touch_fwd_pressed() -> void:
	GameManager.flip_gravity(Vector3.FORWARD)
func _on_touch_back_pressed() -> void:
	GameManager.flip_gravity(Vector3.BACK)

# ══════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════
func _hide_all_panels() -> void:
	game_over_panel.visible = false
	victory_panel.visible = false
	pause_panel.visible = false
	lore_panel.visible = false
	ad_panel.visible = false

func update_sector(level: int) -> void:
	sector_label.text = LocaleManager.t("sector") + " %d" % level
