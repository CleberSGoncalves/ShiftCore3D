extends Node
## GameManager — Gerenciador Central de Estado de Partida (Godot 4.7.2)
## Autoload singleton | Controla: estado, física, gravidade, sessão CrazyGames

# ══════════════════════════════════════════════════════════
# SINAIS
# ══════════════════════════════════════════════════════════
signal score_changed(new_score: int)
signal health_changed(new_health: int)
signal energy_core_collected(total: int)
signal gravity_changed(direction: Vector3)
signal game_over
signal game_started
signal level_completed(level: int)
signal revive_used

# ══════════════════════════════════════════════════════════
# ESTADO DE JOGO
# ══════════════════════════════════════════════════════════
enum GameState { BOOT, INTRO_FLUIDCLEB, LORE, GAMEPLAY, PAUSED, GAME_OVER, VICTORY }

var current_state: GameState = GameState.BOOT
var current_level: int = 1
var max_levels: int = 5

var score: int = 0
var high_score: int = 0
var health: int = 100
var max_health: int = 100
var energy_cores_collected: int = 0
var energy_cores_total: int = 0

var is_game_active: bool = false
var is_physics_frozen: bool = false
var can_revive: bool = true          # 1x por tentativa

# ──────────────────────────────────────────────────────────
# GRAVIDADE MULTIDIRECIONAL (3 EIXOS)
# ──────────────────────────────────────────────────────────
const GRAVITY_STRENGTH: float = 14.0

var gravity_direction: Vector3 = Vector3.DOWN
var gravity_vec: Vector3 = Vector3.DOWN * GRAVITY_STRENGTH

const GRAVITY_DIRS: Array = [
	Vector3.DOWN,  Vector3.UP,
	Vector3.LEFT,  Vector3.RIGHT,
	Vector3.FORWARD, Vector3.BACK
]
const GRAVITY_NAMES_EN: Array = ["Down", "Up", "Left", "Right", "Forward", "Back"]
const GRAVITY_NAMES_PT: Array = ["Baixo", "Cima", "Esquerda", "Direita", "Frente", "Trás"]

# ──────────────────────────────────────────────────────────
# TIMER MIDGAME ADS (a cada 3–4 min em telas de transição)
# ──────────────────────────────────────────────────────────
var _midgame_timer: float = 0.0
const MIDGAME_INTERVAL_MIN: float = 180.0  # 3 minutos
const MIDGAME_INTERVAL_MAX: float = 240.0  # 4 minutos
var _next_midgame_at: float = 200.0
var _midgame_pending: bool = false          # só dispara em telas lógicas

# ══════════════════════════════════════════════════════════
func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_high_score()
	_randomize_next_midgame()

func _process(delta: float) -> void:
	if is_game_active and not is_physics_frozen:
		_midgame_timer += delta
		if _midgame_timer >= _next_midgame_at:
			_midgame_pending = true  # aguarda tela lógica para disparar

# ══════════════════════════════════════════════════════════
# LIFECYCLE
# ══════════════════════════════════════════════════════════
func start_new_game() -> void:
	score = 0
	health = max_health
	energy_cores_collected = 0
	is_game_active = true
	is_physics_frozen = false
	can_revive = true
	current_state = GameState.GAMEPLAY
	gravity_direction = Vector3.DOWN
	gravity_vec = Vector3.DOWN * GRAVITY_STRENGTH
	_midgame_timer = 0.0
	_randomize_next_midgame()
	_midgame_pending = false

	score_changed.emit(score)
	health_changed.emit(health)
	game_started.emit()

	# Notifica CrazyGames que gameplay começou
	if CrazySDK:
		CrazySDK.gameplay_start()

func pause_game() -> void:
	if current_state == GameState.GAMEPLAY:
		current_state = GameState.PAUSED
		is_physics_frozen = true
		if CrazySDK:
			CrazySDK.gameplay_stop()

func resume_game() -> void:
	if current_state == GameState.PAUSED:
		current_state = GameState.GAMEPLAY
		is_physics_frozen = false
		if CrazySDK:
			CrazySDK.gameplay_start()

## Congela ou descongela a física (chamado durante anúncios)
func freeze_physics(freeze: bool) -> void:
	is_physics_frozen = freeze
	get_tree().paused = freeze

# ══════════════════════════════════════════════════════════
# GAMEPLAY ACTIONS
# ══════════════════════════════════════════════════════════
func add_score(points: int) -> void:
	if not is_game_active: return
	score += points
	if score > high_score:
		high_score = score
		_save_high_score()
	score_changed.emit(score)

func take_damage(amount: int) -> void:
	if not is_game_active or is_physics_frozen: return
	health = max(0, health - amount)
	health_changed.emit(health)
	if health <= 0:
		trigger_game_over()

func heal(amount: int) -> void:
	if not is_game_active: return
	health = min(max_health, health + amount)
	health_changed.emit(health)

func collect_energy_core() -> void:
	if not is_game_active: return
	energy_cores_collected += 1
	add_score(100)
	energy_core_collected.emit(energy_cores_collected)
	AudioManager.play_core_collected()
	# Verifica vitória
	if energy_cores_collected >= energy_cores_total and energy_cores_total > 0:
		trigger_level_complete()

# ══════════════════════════════════════════════════════════
# GRAVIDADE MULTIDIRECIONAL
# ══════════════════════════════════════════════════════════
func flip_gravity(new_dir: Vector3) -> void:
	if not is_game_active or is_physics_frozen: return
	gravity_direction = new_dir.normalized()
	gravity_vec = gravity_direction * GRAVITY_STRENGTH
	gravity_changed.emit(gravity_direction)
	AudioManager.play_gravity_flip()
	add_score(5)

func get_gravity_name() -> String:
	var idx: int = GRAVITY_DIRS.find(gravity_direction)
	if idx == -1: return "Custom"
	if LocaleManager and LocaleManager.current_language == LocaleManager.Language.PT_BR:
		return GRAVITY_NAMES_PT[idx]
	return GRAVITY_NAMES_EN[idx]

# ══════════════════════════════════════════════════════════
# GAME OVER / VITÓRIA
# ══════════════════════════════════════════════════════════
func trigger_game_over() -> void:
	if current_state == GameState.GAME_OVER: return
	is_game_active = false
	current_state = GameState.GAME_OVER
	game_over.emit()
	AudioManager.play_game_over()
	if CrazySDK:
		CrazySDK.gameplay_stop()
	# Verifica midgame ad pendente (tela lógica = game over)
	_check_midgame_ad()

func trigger_level_complete() -> void:
	is_game_active = false
	current_state = GameState.VICTORY
	level_completed.emit(current_level)
	AudioManager.play_victory()
	add_score(500 + current_level * 100)
	if CrazySDK:
		CrazySDK.gameplay_stop()
		CrazySDK.happy_time()
	_check_midgame_ad()

func advance_level() -> void:
	current_level = min(current_level + 1, max_levels)
	energy_cores_collected = 0
	can_revive = true

# ══════════════════════════════════════════════════════════
# REWARDED ADS
# ══════════════════════════════════════════════════════════
func request_revive() -> void:
	if not can_revive or not CrazySDK: return
	CrazySDK.rewarded_granted.connect(_on_revive_granted, CONNECT_ONE_SHOT)
	CrazySDK.ad_error.connect(_on_revive_failed, CONNECT_ONE_SHOT)
	CrazySDK.request_rewarded_ad()

func _on_revive_granted() -> void:
	can_revive = false
	health = max_health
	health_changed.emit(health)
	is_game_active = true
	current_state = GameState.GAMEPLAY
	is_physics_frozen = false
	revive_used.emit()
	if CrazySDK:
		CrazySDK.gameplay_start()

func _on_revive_failed(_err: String) -> void:
	# Nunca conceder recompensa em caso de erro (AdBlock)
	pass

func request_double_reward() -> void:
	if not CrazySDK: return
	CrazySDK.rewarded_granted.connect(_on_double_reward_granted, CONNECT_ONE_SHOT)
	CrazySDK.ad_error.connect(_on_double_reward_failed, CONNECT_ONE_SHOT)
	CrazySDK.request_rewarded_ad()

func _on_double_reward_granted() -> void:
	score *= 2
	score_changed.emit(score)

func _on_double_reward_failed(_err: String) -> void:
	pass

# ══════════════════════════════════════════════════════════
# MIDGAME ADS
# ══════════════════════════════════════════════════════════
func _check_midgame_ad() -> void:
	if _midgame_pending and CrazySDK:
		_midgame_pending = false
		_midgame_timer = 0.0
		_randomize_next_midgame()
		await get_tree().create_timer(0.5).timeout
		CrazySDK.request_midgame_ad()

func _randomize_next_midgame() -> void:
	_next_midgame_at = randf_range(MIDGAME_INTERVAL_MIN, MIDGAME_INTERVAL_MAX)

# ══════════════════════════════════════════════════════════
# SAVE / LOAD
# ══════════════════════════════════════════════════════════
func _save_high_score() -> void:
	var save_data := {"hs": high_score, "lvl": current_level}
	var json_str := JSON.stringify(save_data)
	if OS.has_feature("web"):
		JavaScriptBridge.eval("localStorage.setItem('shiftcore_save', '%s');" % json_str, true)
	else:
		var f := FileAccess.open("user://save.json", FileAccess.WRITE)
		if f:
			f.store_string(json_str)
			f.close()

func _load_high_score() -> void:
	var json_str: String = ""
	if OS.has_feature("web"):
		var r = JavaScriptBridge.eval("localStorage.getItem('shiftcore_save') || '';", true)
		if r != null: json_str = str(r)
	else:
		if FileAccess.file_exists("user://save.json"):
			var f := FileAccess.open("user://save.json", FileAccess.READ)
			if f:
				json_str = f.get_as_text()
				f.close()
	if json_str != "":
		var parsed = JSON.parse_string(json_str)
		if parsed is Dictionary:
			high_score = parsed.get("hs", 0)
			current_level = parsed.get("lvl", 1)
