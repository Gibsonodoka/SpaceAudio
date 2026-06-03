import 'package:just_audio/just_audio.dart';

class AudioPlayerService {
  static final AudioPlayerService _instance = AudioPlayerService._internal();
  factory AudioPlayerService() => _instance;
  AudioPlayerService._internal();

  final AudioPlayer _player = AudioPlayer();
  double _volume = 0.8;

  AudioPlayer get player => _player;

  Future<void> play(String url) async {
    try {
      await _player.setUrl(url);
      await _player.setVolume(_volume);
      await _player.play();
    } catch (e) {
      print('Audio play error: $e');
    }
  }

  Future<void> pause() async {
    try {
      await _player.pause();
    } catch (e) {
      print('Audio pause error: $e');
    }
  }

  Future<void> stop() async {
    try {
      await _player.stop();
    } catch (e) {
      print('Audio stop error: $e');
    }
  }

  Future<void> setVolume(double volume) async {
    _volume = volume.clamp(0.0, 1.0);
    await _player.setVolume(_volume);
  }

  bool get isPlaying => _player.playing;

  void dispose() {
    _player.dispose();
  }
}