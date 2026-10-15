extends Node
## CrazySDK — Bridge Godot ↔ CrazyGames SDK v3 via JavaScript
## Autoload singleton — process_mode = ALWAYS
## Handles: init, gameplayStart/Stop, rewarded ads, midgame ads, mute/pause

signal ad_started
signal ad_finished
signal ad_error(err: String)
signal rewarded_granted
signal sdk_ready

var _sdk_initialized: bool = false
var _ad_in_progress: bool = false

# ──────────────────────────────────────────────────────
func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if OS.has_feature("web"):
		_init_sdk_async()
	else:
		# Desktop / editor fallback — SDK simulado
		_sdk_initialized = true
		sdk_ready.emit()

# ──────────────────────────────────────────────────────
func _init_sdk_async() -> void:
	await _js_init_sdk()

func _js_init_sdk() -> void:
	if not OS.has_feature("web"):
		return
	# Chama a função JavaScript exposta pelo index.html wrapper
	var result = JavaScriptBridge.eval("""
		(async function() {
			if (window.CrazyGames && window.CrazyGames.SDK) {
				try {
					await window.CrazyGames.SDK.init();
					window._crazySdkReady = true;
				} catch(e) {
					window._crazySdkReady = false;
				}
			} else {
				window._crazySdkReady = false;
			}
		})();
		true;
	""", true)
	# Poll por até 3s para sdk ready
	var timeout: float = 3.0
	var elapsed: float = 0.0
	while elapsed < timeout:
		await get_tree().create_timer(0.1).timeout
		elapsed += 0.1
		var ready = JavaScriptBridge.eval("window._crazySdkReady === true;", true)
		if ready:
			break
	_sdk_initialized = true
	sdk_ready.emit()

# ──────────────────────────────────────────────────────
## Sinaliza ao SDK que a gameplay ativa começou
func gameplay_start() -> void:
	if not OS.has_feature("web"): return
	JavaScriptBridge.eval("""
		if (window.CrazyGames && window.CrazyGames.SDK) {
			window.CrazyGames.SDK.game.gameplayStart();
		}
	""", true)

## Sinaliza ao SDK que a gameplay parou (menu, morte, pausa)
func gameplay_stop() -> void:
	if not OS.has_feature("web"): return
	JavaScriptBridge.eval("""
		if (window.CrazyGames && window.CrazyGames.SDK) {
			window.CrazyGames.SDK.game.gameplayStop();
		}
	""", true)

# ──────────────────────────────────────────────────────
## Exibe Rewarded Ad — muta áudio, pausa física, aguarda resultado
func request_rewarded_ad() -> void:
	if _ad_in_progress: return
	_ad_in_progress = true
	AudioManager.mute_all(true)
	GameManager.freeze_physics(true)
	ad_started.emit()
	if not OS.has_feature("web"):
		# Simulação em editor: concede recompensa após 1s
		await get_tree().create_timer(1.0).timeout
		_on_ad_done(true, "")
		return
	JavaScriptBridge.eval("""
		(async function() {
			if (window.CrazyGames && window.CrazyGames.SDK) {
				try {
					await window.CrazyGames.SDK.ad.requestAd('rewarded', {
						adStarted: () => { window._adResult = null; },
						adFinished: () => { window._adResult = 'finished'; },
						adError: (e) => { window._adResult = 'error:' + String(e); }
					});
				} catch(e) {
					window._adResult = 'error:' + String(e);
				}
			} else {
				window._adResult = 'error:no_sdk';
			}
		})();
	""", true)
	# Poll resultado
	var timeout: float = 60.0
	var elapsed: float = 0.0
	while elapsed < timeout:
		await get_tree().create_timer(0.25).timeout
		elapsed += 0.25
		var res = JavaScriptBridge.eval("window._adResult || '';", true)
		if res != "" and res != null:
			var granted: bool = (res == "finished")
			var err_msg: String = "" if granted else str(res)
			_on_ad_done(granted, err_msg)
			return
	_on_ad_done(false, "timeout")

func _on_ad_done(granted: bool, err: String) -> void:
	_ad_in_progress = false
	AudioManager.mute_all(false)
	GameManager.freeze_physics(false)
	JavaScriptBridge.eval("window._adResult = undefined;", true)
	# CRÍTICO: ad_finished SEMPRE emitido — para ocultar AdPanel mesmo com AdBlock
	# rewarded_granted só é emitido se o anúncio foi realmente assistido
	if granted:
		rewarded_granted.emit()
	else:
		ad_error.emit(err)
	# Sempre fecha o painel de anúncio (independente de erro ou sucesso)
	ad_finished.emit()

# ──────────────────────────────────────────────────────
## Midgame / Interstitial Ad — apenas em telas de transição lógica
func request_midgame_ad() -> void:
	if _ad_in_progress: return
	_ad_in_progress = true
	AudioManager.mute_all(true)
	GameManager.freeze_physics(true)
	ad_started.emit()
	if not OS.has_feature("web"):
		await get_tree().create_timer(1.0).timeout
		_on_midgame_done()
		return
	JavaScriptBridge.eval("""
		(async function() {
			if (window.CrazyGames && window.CrazyGames.SDK) {
				try {
					await window.CrazyGames.SDK.ad.requestAd('midgame', {
						adStarted: () => { window._midgameResult = null; },
						adFinished: () => { window._midgameResult = 'done'; },
						adError: (e) => { window._midgameResult = 'done'; }
					});
				} catch(e) {
					window._midgameResult = 'done';
				}
			} else {
				window._midgameResult = 'done';
			}
		})();
	""", true)
	var timeout: float = 60.0
	var elapsed: float = 0.0
	while elapsed < timeout:
		await get_tree().create_timer(0.25).timeout
		elapsed += 0.25
		var res = JavaScriptBridge.eval("window._midgameResult || '';", true)
		if res != "" and res != null:
			_on_midgame_done()
			return
	_on_midgame_done()

func _on_midgame_done() -> void:
	_ad_in_progress = false
	AudioManager.mute_all(false)
	GameManager.freeze_physics(false)
	JavaScriptBridge.eval("window._midgameResult = undefined;", true)
	ad_finished.emit()

# ──────────────────────────────────────────────────────
## Happy Time (conquista/vitória)
func happy_time() -> void:
	if not OS.has_feature("web"): return
	JavaScriptBridge.eval("""
		if (window.CrazyGames && window.CrazyGames.SDK) {
			window.CrazyGames.SDK.game.happyTime(1.0);
		}
	""", true)
