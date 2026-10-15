extends Node
## LevelGenerator — Gerador procedural de setores cúbicos (níveis)
## Cada nível tem: plataformas cúbicas, núcleos energéticos, armadilhas, zonas de vento

const PLATFORM_SCENE := preload("res://scenes/platform.tscn")
const ENERGY_CORE_SCENE := preload("res://scenes/energy_core.tscn")
const HAZARD_SCENE := preload("res://scenes/hazard.tscn")

# Configuração por nível
const LEVEL_CONFIG: Array = [
	# Nível 1 — Tutorial: simples, 3 cores
	{"platforms": 12, "cores": 3, "hazards": 0, "size": Vector3(20, 20, 20)},
	# Nível 2 — 5 cores, 2 armadilhas
	{"platforms": 18, "cores": 5, "hazards": 2, "size": Vector3(28, 28, 28)},
	# Nível 3 — 7 cores, 4 armadilhas
	{"platforms": 24, "cores": 7, "hazards": 4, "size": Vector3(36, 36, 36)},
	# Nível 4 — 9 cores, 6 armadilhas
	{"platforms": 30, "cores": 9, "hazards": 6, "size": Vector3(44, 44, 44)},
	# Nível 5 — 12 cores, 8 armadilhas
	{"platforms": 36, "cores": 12, "hazards": 8, "size": Vector3(52, 52, 52)},
]

var _generated_nodes: Array[Node] = []

func generate_level(parent: Node3D, level: int) -> void:
	clear_level()
	var idx := clampi(level - 1, 0, LEVEL_CONFIG.size() - 1)
	var cfg: Dictionary = LEVEL_CONFIG[idx]
	var arena_size: Vector3 = cfg["size"]

	if GameManager:
		GameManager.energy_cores_total = cfg["cores"]
		GameManager.energy_cores_collected = 0

	# Gera paredes invisíveis (limites da arena cúbica)
	_spawn_arena_walls(parent, arena_size)

	# Gera plataformas aleatórias dentro da arena
	var rng := RandomNumberGenerator.new()
	rng.seed = hash("shiftcore_%d" % level)

	for i in cfg["platforms"]:
		var pos := Vector3(
			rng.randf_range(-arena_size.x * 0.4, arena_size.x * 0.4),
			rng.randf_range(-arena_size.y * 0.4, arena_size.y * 0.4),
			rng.randf_range(-arena_size.z * 0.4, arena_size.z * 0.4)
		)
		var plat := PLATFORM_SCENE.instantiate()
		parent.add_child(plat)
		plat.global_position = pos
		_generated_nodes.append(plat)

	# Gera núcleos energéticos
	for i in cfg["cores"]:
		var pos := Vector3(
			rng.randf_range(-arena_size.x * 0.35, arena_size.x * 0.35),
			rng.randf_range(-arena_size.y * 0.35, arena_size.y * 0.35),
			rng.randf_range(-arena_size.z * 0.35, arena_size.z * 0.35)
		)
		var core := ENERGY_CORE_SCENE.instantiate()
		parent.add_child(core)
		core.global_position = pos
		_generated_nodes.append(core)

	# Gera armadilhas (partir do nível 2)
	for i in cfg["hazards"]:
		var pos := Vector3(
			rng.randf_range(-arena_size.x * 0.3, arena_size.x * 0.3),
			rng.randf_range(-arena_size.y * 0.3, arena_size.y * 0.3),
			rng.randf_range(-arena_size.z * 0.3, arena_size.z * 0.3)
		)
		var hazard := HAZARD_SCENE.instantiate()
		parent.add_child(hazard)
		hazard.global_position = pos
		_generated_nodes.append(hazard)

func _spawn_arena_walls(parent: Node3D, size: Vector3) -> void:
	var half := size * 0.5
	var walls := [
		# Formato: [posição, tamanho]
		[Vector3(0, -half.y, 0), Vector3(size.x, 0.5, size.z)],   # Chão base
		[Vector3(0, half.y, 0), Vector3(size.x, 0.5, size.z)],    # Teto
		[Vector3(-half.x, 0, 0), Vector3(0.5, size.y, size.z)],   # Esq
		[Vector3(half.x, 0, 0), Vector3(0.5, size.y, size.z)],    # Dir
		[Vector3(0, 0, -half.z), Vector3(size.x, size.y, 0.5)],   # Frente
		[Vector3(0, 0, half.z), Vector3(size.x, size.y, 0.5)],    # Trás
	]
	for w in walls:
		var wall := StaticBody3D.new()
		wall.collision_layer = 2   # FIX: mesma camada das plataformas — player colide
		wall.collision_mask = 0
		var col := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = w[1]
		col.shape = shape
		wall.add_child(col)
		# Visual semi-transparente das paredes
		var mesh_inst := MeshInstance3D.new()
		var box_mesh := BoxMesh.new()
		box_mesh.size = w[1]
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(0.0, 0.8, 1.0, 0.12)
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		mat.emission_enabled = true
		mat.emission = Color(0.0, 0.5, 1.0)
		mat.emission_energy_multiplier = 0.3
		box_mesh.material = mat
		mesh_inst.mesh = box_mesh
		wall.add_child(mesh_inst)
		parent.add_child(wall)
		wall.global_position = w[0]
		_generated_nodes.append(wall)

func clear_level() -> void:
	for node in _generated_nodes:
		if is_instance_valid(node):
			node.queue_free()
	_generated_nodes.clear()
