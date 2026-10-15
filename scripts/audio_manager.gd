extends Node
## AudioManager — Autoload singleton para controle centralizado de áudio
## Garante mute durante anúncios CrazyGames

var _master_muted: bool = false
var _music_player: AudioStreamPlayer = null
var _sfx_players: Array[AudioStreamPlayer] = []

# Pitch variation range for juice
const PITCH_MIN: float = 0.93
const PITCH_MAX: float = 1.07

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

## Muta ou desmuta todo o áudio do jogo
func mute_all(mute: bool) -> void:
	_master_muted = mute
	AudioServer.set_bus_mute(AudioServer.get_bus_index("Master"), mute)

## Toca SFX sintético via AudioStreamGenerator (sem arquivos externos)
func play_sfx_synthetic(freq_hz: float = 440.0, duration: float = 0.15,
		wave_type: String = "sine", vol_db: float = -8.0) -> void:
	if _master_muted: return
	var player := AudioStreamPlayer.new()
	var gen := AudioStreamGenerator.new()
	gen.mix_rate = 44100.0
	gen.buffer_length = duration
	player.stream = gen
	player.volume_db = vol_db
	player.pitch_scale = PITCH_MIN + randf() * (PITCH_MAX - PITCH_MIN)
	add_child(player)
	player.play()
	# Gera amostras sinteticamente
	await get_tree().process_frame
	var pb := player.get_stream_playback()
	if pb:
		var sample_count := int(gen.mix_rate * duration)
		var frames_avail := pb.get_frames_available()
		var frames_to_fill := mini(sample_count, frames_avail)
		for i in frames_to_fill:
			var t: float = float(i) / gen.mix_rate
			var envelope: float = 1.0 - (t / duration)  # fade out linear
			var sample: float = 0.0
			match wave_type:
				"sine":
					sample = sin(TAU * freq_hz * t) * envelope
				"square":
					sample = (1.0 if sin(TAU * freq_hz * t) > 0 else -1.0) * envelope * 0.5
				"saw":
					sample = (2.0 * (t * freq_hz - floor(t * freq_hz + 0.5))) * envelope * 0.5
			pb.push_frame(Vector2(sample, sample))
	# Limpa o player após tocado
	await get_tree().create_timer(duration + 0.05).timeout
	if is_instance_valid(player):
		player.queue_free()

## Toca som de flip de gravidade
func play_gravity_flip() -> void:
	play_sfx_synthetic(220.0 + randf() * 80.0, 0.18, "sine", -6.0)

## Toca som de coleta de núcleo energético
func play_core_collected() -> void:
	play_sfx_synthetic(880.0, 0.3, "sine", -4.0)

## Toca som de game over
func play_game_over() -> void:
	play_sfx_synthetic(110.0, 0.5, "square", -6.0)

## Toca som de vitória
func play_victory() -> void:
	play_sfx_synthetic(660.0, 0.4, "sine", -3.0)

## Toca som do robô aterrissar
func play_land() -> void:
	play_sfx_synthetic(160.0, 0.08, "square", -10.0)

## Toca som de interface
func play_ui_click() -> void:
	play_sfx_synthetic(500.0, 0.06, "sine", -12.0)
