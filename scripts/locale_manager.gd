extends Node
## LocaleManager — Detecção e gerenciamento de localização
## Suporte: EN (padrão) + PT-BR (detectado automaticamente)

enum Language { EN, PT_BR }

var current_language: Language = Language.EN

const STRINGS_EN: Dictionary = {
	"score": "Score",
	"energy_cores": "Energy Cores",
	"health": "Hull Integrity",
	"game_over": "MISSION FAILED",
	"victory": "SECTOR CLEARED!",
	"restart": "Try Again",
	"next_level": "Next Sector",
	"revive": "⊙ Quantum Revival",
	"double_reward": "⊙ Double Data",
	"skip": "Skip",
	"lore_title": "CUBO-NAUT MISSION LOG",
	"lore_1": "In the distant future, humanity explores space through\nfloating cubic mega-structures filled with secrets.",
	"lore_2": "As a Cubo-Naut — a last-generation exploration robot —\nyour mission: navigate gravitational labyrinths.",
	"lore_3": "Reactivate energy cores, manipulate gravity in 3 axes,\nand unravel the mysteries of your creation.",
	"controls_title": "CONTROLS",
	"controls_body": "W/A/S/D — Flip Gravity\nQ/E — Forward/Back Flip\nF / ENTER — Interact",
	"sector": "SECTOR",
	"gravity_dir": "Gravity:",
	"pause": "PAUSED",
	"resume": "Resume",
	"watching_ad": "Loading Quantum Data...",
	"ad_reward_title": "Quantum Revival",
	"ad_reward_desc": "Watch a short clip to revive\nwith 3 seconds of invulnerability!",
	"ad_double_title": "Double Data Cache",
	"ad_double_desc": "Watch a short clip to double\nyour collected data!",
	"watch": "Watch",
	"cancel": "Cancel",
}

const STRINGS_PT: Dictionary = {
	"score": "Pontuação",
	"energy_cores": "Núcleos de Energia",
	"health": "Integridade do Casco",
	"game_over": "MISSÃO FALHOU",
	"victory": "SETOR LIMPO!",
	"restart": "Tentar Novamente",
	"next_level": "Próximo Setor",
	"revive": "⊙ Reviver Quântico",
	"double_reward": "⊙ Dobrar Dados",
	"skip": "Pular",
	"lore_title": "REGISTRO DE MISSÃO: CUBO-NAUTA",
	"lore_1": "Num futuro distante, a humanidade explora o espaço\natravés de megaestruturas cúbicas flutuantes.",
	"lore_2": "Como um Cubo-Nauta — robô de exploração de última geração —\nsua missão: navegar labirintos gravitacionais.",
	"lore_3": "Reative núcleos energéticos, manipule a gravidade em 3 eixos\ne desvende os mistérios da sua criação.",
	"controls_title": "CONTROLES",
	"controls_body": "W/A/S/D — Inverter Gravidade\nQ/E — Flip Frente/Trás\nF / ENTER — Interagir",
	"sector": "SETOR",
	"gravity_dir": "Gravidade:",
	"pause": "PAUSADO",
	"resume": "Continuar",
	"watching_ad": "Carregando Dados Quânticos...",
	"ad_reward_title": "Reviver Quântico",
	"ad_reward_desc": "Assista um clipe curto para reviver\ncom 3 segundos de invulnerabilidade!",
	"ad_double_title": "Dobrar Cache de Dados",
	"ad_double_desc": "Assista um clipe curto para dobrar\nos dados coletados!",
	"watch": "Assistir",
	"cancel": "Cancelar",
}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_detect_language()

func _detect_language() -> void:
	var locale: String = ""
	if OS.has_feature("web"):
		# Tenta obter locale do navegador via JS
		var js_locale = JavaScriptBridge.eval("navigator.language || navigator.userLanguage || 'en';", true)
		if js_locale != null:
			locale = str(js_locale).to_lower()
	else:
		locale = OS.get_locale().to_lower()

	if locale.begins_with("pt"):
		current_language = Language.PT_BR
	else:
		current_language = Language.EN

func t(key: String) -> String:
	match current_language:
		Language.PT_BR:
			return STRINGS_PT.get(key, STRINGS_EN.get(key, key))
		_:
			return STRINGS_EN.get(key, key)
