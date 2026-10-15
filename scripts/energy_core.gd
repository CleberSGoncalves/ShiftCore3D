extends Area3D
## EnergyCore — Núcleo Energético coletável
## Rotação procedural + pulsação + partículas ao coletar

var _rotation_speed: float = 1.2
var _pulse_time: float = 0.0
var _collected: bool = false

@onready var mesh_inst: MeshInstance3D = $MeshInstance3D
@onready var glow_light: OmniLight3D = $OmniLight3D

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	_rotation_speed = 0.8 + randf() * 0.8  # variação entre núcleos

func _process(delta: float) -> void:
	if _collected: return
	# Rotação em múltiplos eixos para look futurista
	rotate_y(_rotation_speed * delta)
	rotate_x(_rotation_speed * 0.5 * delta)
	# Pulsação de escala (respira)
	_pulse_time += delta * 2.0
	var pulse := 1.0 + 0.1 * sin(_pulse_time)
	scale = Vector3.ONE * pulse
	# Pulsação da luz
	if glow_light:
		glow_light.light_energy = 1.5 + 0.5 * sin(_pulse_time)

func _on_body_entered(body: Node3D) -> void:
	if _collected: return
	if body.is_in_group("player"):
		_collected = true
		_spawn_collect_particles()
		if GameManager:
			GameManager.collect_energy_core()
		queue_free()

func _spawn_collect_particles() -> void:
	# Partículas procedurais simples via GpuParticles3D
	var particles := GPUParticles3D.new()
	get_parent().add_child(particles)
	particles.global_position = global_position
	var mat := ParticleProcessMaterial.new()
	mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	mat.emission_sphere_radius = 0.5
	mat.initial_velocity_min = 2.0
	mat.initial_velocity_max = 5.0
	mat.gravity = Vector3.ZERO
	mat.color = Color(0.0, 0.95, 1.0)
	mat.scale_min = 0.1
	mat.scale_max = 0.25
	particles.process_material = mat
	particles.amount = 24
	particles.lifetime = 0.6
	particles.one_shot = true
	particles.emitting = true
	# Limpa após expirar
	get_tree().create_timer(1.0).timeout.connect(particles.queue_free)
