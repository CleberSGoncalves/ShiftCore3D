extends Area3D
## Hazard — Armadilha (zona de dano)
## Picos elétricos rotativos, causa dano ao tocar

@export var damage_amount: int = 25
@export var rotation_speed: float = 1.5

@onready var mesh_inst: MeshInstance3D = $MeshInstance3D

var _damage_cooldown: float = 0.0
const DAMAGE_INTERVAL: float = 0.8  # dano a cada 0.8s

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	rotate_y(rotation_speed * delta)
	rotate_z(rotation_speed * 0.7 * delta)
	if _damage_cooldown > 0.0:
		_damage_cooldown -= delta

func _on_body_entered(body: Node3D) -> void:
	if _damage_cooldown > 0.0: return
	if body.is_in_group("player"):
		_damage_cooldown = DAMAGE_INTERVAL
		if body.has_method("receive_damage"):
			body.receive_damage(damage_amount)
		# Efeito visual de dano
		var tween := create_tween()
		if mesh_inst and mesh_inst.material_override:
			tween.tween_property(mesh_inst.material_override, "emission_energy_multiplier", 4.0, 0.05)
			tween.tween_property(mesh_inst.material_override, "emission_energy_multiplier", 1.0, 0.2)
