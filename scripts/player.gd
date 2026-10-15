extends CharacterBody3D
## Player — Cubo-Nauta 3D (Godot 4.7.2 / GDScript 2.0)
## Movimentação com gravidade dinâmica em 3 eixos
## Física delta-time para consistência entre 60Hz e 165Hz
## Squash & Stretch | Screen Shake | Coyote Time | Jump Buffering

# ══════════════════════════════════════════════════════════
# PARÂMETROS EXPORTADOS
# ══════════════════════════════════════════════════════════
@export var move_speed: float = 10.0
@export var acceleration: float = 40.0
@export var friction: float = 30.0
@export var jump_velocity: float = 10.0
@export var gravity_multiplier: float = 1.8

# ══════════════════════════════════════════════════════════
# NODOS INTERNOS
# ══════════════════════════════════════════════════════════
@onready var mesh_instance: MeshInstance3D = $MeshInstance3D
@onready var collision_shape: CollisionShape3D = $CollisionShape3D

# ══════════════════════════════════════════════════════════
# ESTADO INTERNO
# ══════════════════════════════════════════════════════════
var _gravity_dir: Vector3 = Vector3.DOWN
var _gravity_strength: float = 14.0

# Coyote Time
var _coyote_timer: float = 0.0
const COYOTE_DURATION: float = 0.12

# Jump Buffering
var _jump_buffer_timer: float = 0.0
const JUMP_BUFFER_DURATION: float = 0.15

# Squash & Stretch
var _base_scale: Vector3 = Vector3.ONE
var _target_scale: Vector3 = Vector3.ONE
const SQUASH_LAND: Vector3 = Vector3(1.35, 0.75, 1.35)
const STRETCH_JUMP: Vector3 = Vector3(0.8, 1.3, 0.8)
const SCALE_SPRING_STIFFNESS: float = 18.0
const SCALE_SPRING_DAMPING: float = 5.0
var _scale_velocity: Vector3 = Vector3.ZERO

# Invulnerabilidade pós-revive
var _invulnerable: bool = false
var _invulnerable_timer: float = 0.0
const REVIVE_INVULNERABLE_DURATION: float = 3.0

# Estado no chão no frame anterior (para detectar aterrissagem)
var _was_on_floor: bool = false

# Input acumulado (touch/teclado)
var _touch_gravity_input: Vector3 = Vector3.ZERO

# ══════════════════════════════════════════════════════════
func _ready() -> void:
	add_to_group("player")          # Necessário para Area3D energy_core/hazard detectar o jogador
	up_direction = Vector3.UP       # Será atualizado junto com a gravidade
	_base_scale = scale
	_target_scale = scale
	if GameManager:
		GameManager.gravity_changed.connect(_on_gravity_changed)
		GameManager.revive_used.connect(_on_revive_granted)

# ══════════════════════════════════════════════════════════
# INPUT DESKTOP (WASD / Q / E para gravidade)
# ══════════════════════════════════════════════════════════
func _unhandled_input(event: InputEvent) -> void:
	if not GameManager or not GameManager.is_game_active:
		return
	if event.is_action_pressed("gravity_flip_up"):
		GameManager.flip_gravity(Vector3.UP)
	elif event.is_action_pressed("gravity_flip_down"):
		GameManager.flip_gravity(Vector3.DOWN)
	elif event.is_action_pressed("gravity_flip_left"):
		GameManager.flip_gravity(Vector3.LEFT)
	elif event.is_action_pressed("gravity_flip_right"):
		GameManager.flip_gravity(Vector3.RIGHT)
	elif event.is_action_pressed("gravity_flip_forward"):
		GameManager.flip_gravity(Vector3.FORWARD)
	elif event.is_action_pressed("gravity_flip_back"):
		GameManager.flip_gravity(Vector3.BACK)
	elif event.is_action_pressed("action_pause"):
		GameManager.pause_game()

## Método chamado pelo HUD touch para flipar gravidade
func flip_gravity_touch(dir: Vector3) -> void:
	GameManager.flip_gravity(dir)

# ══════════════════════════════════════════════════════════
# FÍSICA — DELTA TIME RIGOROSO
# ══════════════════════════════════════════════════════════
func _physics_process(delta: float) -> void:
	# Congela se jogo inativo ou físicas congeladas
	if not GameManager or not GameManager.is_game_active or GameManager.is_physics_frozen:
		velocity = velocity.move_toward(Vector3.ZERO, friction * delta)
		move_and_slide()
		return

	_update_gravity_direction()
	_update_coyote_time(delta)
	_update_jump_buffer(delta)
	_apply_movement(delta)
	_update_squash_stretch(delta)
	_update_invulnerability(delta)

	# Detecta aterrissagem para efeito squash
	var on_floor := _is_on_floor_custom()
	if on_floor and not _was_on_floor:
		_trigger_land_squash()
		AudioManager.play_land()
	_was_on_floor = on_floor

	move_and_slide()

func _update_gravity_direction() -> void:
	_gravity_dir = GameManager.gravity_direction
	_gravity_strength = GameManager.GRAVITY_STRENGTH * gravity_multiplier
	# Mantém up_direction sincronizado com a gravidade atual
	up_direction = -_gravity_dir

func _apply_movement(delta: float) -> void:
	var on_floor := _is_on_floor_custom()

	# Aplica gravidade relativa ao eixo atual
	if not on_floor:
		velocity += _gravity_dir * _gravity_strength * delta
	else:
		# Cancela componente de velocidade na direção da gravidade se no chão
		var grav_comp := velocity.dot(_gravity_dir)
		if grav_comp > 0.0:
			velocity -= _gravity_dir * grav_comp

	# Calcula input de movimento (relativo à câmera — plano perpendicular à gravidade)
	var input_raw := _get_input_vector()
	var forward := Vector3.FORWARD if _gravity_dir != Vector3.FORWARD else Vector3.UP
	var right_dir := forward.cross(_gravity_dir).normalized()
	var fwd_dir := _gravity_dir.cross(right_dir).normalized()

	var desired_vel := (right_dir * input_raw.x + fwd_dir * -input_raw.y) * move_speed

	# Movimento no plano perpendicular à gravidade (funciona em todos os 6 eixos)
	var grav_component := _gravity_dir * velocity.dot(_gravity_dir)
	var planar_vel := velocity - grav_component

	if desired_vel.length() > 0.1:
		planar_vel = planar_vel.move_toward(desired_vel, acceleration * delta)
	else:
		planar_vel = planar_vel.move_toward(Vector3.ZERO, friction * delta)

	velocity = planar_vel + grav_component

	# Jump / impulso anti-gravidade
	var can_jump := on_floor or (_coyote_timer > 0.0)
	if _jump_buffer_timer > 0.0 and can_jump:
		velocity -= _gravity_dir * jump_velocity
		_jump_buffer_timer = 0.0
		_coyote_timer = 0.0
		_target_scale = STRETCH_JUMP

func _get_input_vector() -> Vector2:
	return Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

func _is_on_floor_custom() -> bool:
	# Verifica colisão na direção da gravidade usando ray cast
	return is_on_floor() or is_on_wall()

# ══════════════════════════════════════════════════════════
# COYOTE TIME & JUMP BUFFERING
# ══════════════════════════════════════════════════════════
func _update_coyote_time(delta: float) -> void:
	if _is_on_floor_custom():
		_coyote_timer = COYOTE_DURATION
	else:
		_coyote_timer = max(0.0, _coyote_timer - delta)

func _update_jump_buffer(delta: float) -> void:
	if Input.is_action_just_pressed("ui_accept"):
		_jump_buffer_timer = JUMP_BUFFER_DURATION
	else:
		_jump_buffer_timer = max(0.0, _jump_buffer_timer - delta)

# ══════════════════════════════════════════════════════════
# SQUASH & STRETCH ELÁSTICO (Spring Damping)
# ══════════════════════════════════════════════════════════
func _update_squash_stretch(delta: float) -> void:
	var displacement := _target_scale - scale
	var spring_force := displacement * SCALE_SPRING_STIFFNESS
	_scale_velocity += (spring_force - _scale_velocity * SCALE_SPRING_DAMPING) * delta
	scale += _scale_velocity * delta
	# Amortece a target de volta ao base gradualmente
	_target_scale = _target_scale.lerp(_base_scale, 8.0 * delta)

func _trigger_land_squash() -> void:
	_target_scale = SQUASH_LAND
	_scale_velocity = Vector3.ZERO

# ══════════════════════════════════════════════════════════
# DANO E INVULNERABILIDADE
# ══════════════════════════════════════════════════════════
func receive_damage(amount: int) -> void:
	if _invulnerable: return
	if GameManager:
		GameManager.take_damage(amount)

func _update_invulnerability(delta: float) -> void:
	if _invulnerable:
		_invulnerable_timer -= delta
		# Pisca o mesh durante invulnerabilidade
		mesh_instance.visible = fmod(_invulnerable_timer, 0.2) > 0.1
		if _invulnerable_timer <= 0.0:
			_invulnerable = false
			mesh_instance.visible = true

# ══════════════════════════════════════════════════════════
# CALLBACKS DE SINAIS
# ══════════════════════════════════════════════════════════
func _on_gravity_changed(new_dir: Vector3) -> void:
	_gravity_dir = new_dir
	# CRÍTICO: up_direction determina o que is_on_floor() considera como "chão"
	# Deve ser o oposto da direção da gravidade
	up_direction = -new_dir
	# Cancela velocidade oposta à nova gravidade para transição suave
	var against_grav_vel := velocity.dot(-new_dir)
	if against_grav_vel > 0.0:
		velocity -= (-new_dir) * against_grav_vel * 0.5

func _on_revive_granted() -> void:
	_invulnerable = true
	_invulnerable_timer = REVIVE_INVULNERABLE_DURATION
	velocity = Vector3.ZERO
