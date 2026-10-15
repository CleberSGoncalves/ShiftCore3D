extends Node
## BootScene — Cena de inicialização do ShiftCore3D
## Executa: Intro FluidCleb (0.0–2.8s) → aguarda SDK → vai para main.tscn

const INTRO_DURATION: float = 2.8

func _ready() -> void:
	# Aguarda SDK e executa sequência de boot
	_run_boot_sequence()

func _run_boot_sequence() -> void:
	# A intro FluidCleb é renderizada na Web via JavaScript/Canvas no index.html
	# Aqui apenas aguardamos o tempo da intro antes de carregar a cena principal
	await get_tree().create_timer(INTRO_DURATION + 0.2).timeout

	# Aguarda SDK inicializado (com timeout de segurança)
	var sdk_wait: float = 0.0
	while CrazySDK and not CrazySDK._sdk_initialized and sdk_wait < 5.0:
		await get_tree().create_timer(0.1).timeout
		sdk_wait += 0.1

	get_tree().change_scene_to_file("res://scenes/main.tscn")
