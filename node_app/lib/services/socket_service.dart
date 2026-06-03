import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/constants.dart';
import 'audio_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  final AudioPlayerService _audio = AudioPlayerService();
  Timer? _heartbeatTimer;

  String? _currentTrackId;
  String? _currentTrackTitle;
  String? _currentTrackUrl;

  final StreamController<String> _statusController =
      StreamController<String>.broadcast();
  final StreamController<Map<String, dynamic>> _commandController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<String> get statusStream => _statusController.stream;
  Stream<Map<String, dynamic>> get commandStream => _commandController.stream;

  bool get isConnected => _socket?.connected ?? false;
  String? get currentTrackTitle => _currentTrackTitle;

  void connect(String token) {
    _socket = IO.io(
      Constants.apiUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableReconnection()
          .setReconnectionAttempts(999)
          .setReconnectionDelay(3000)
          .setReconnectionDelayMax(10000)
          .setTimeout(20000)
          .build(),
    );

    _socket!.onConnect((_) {
      print('Socket connected');
      _statusController.add('connected');
      _startHeartbeat();
    });

    _socket!.onDisconnect((_) {
      print('Socket disconnected');
      _statusController.add('disconnected');
      _stopHeartbeat();
    });

    _socket!.onConnectError((err) {
      print('Connection error: $err');
      _statusController.add('error');
    });

    _socket!.on('heartbeat_ack', (_) {});

    _socket!.on('command', (data) async {
      final command = data['command'] as String;
      final payload = data['payload'] ?? {};

      print('Received command: $command');
      _commandController.add({'command': command, 'payload': payload});

      switch (command) {
        case 'play':
          final url = payload['url'] as String?;
          if (url != null && url.isNotEmpty) {
            _currentTrackUrl = url;
            _currentTrackId = payload['trackId'] as String?;
            _currentTrackTitle = payload['trackTitle'] as String? ?? _extractTitle(url);

            await _audio.play(url);

            _socket!.emit('playback_started', {
              'trackId': _currentTrackId,
              'trackTitle': _currentTrackTitle,
              'trackUrl': _currentTrackUrl,
            })  ;
          }
          break;

        case 'pause':
          await _audio.pause();
          _socket!.emit('playback_paused', {
            'trackId': _currentTrackId,
          });
          break;

        case 'stop':
          await _audio.stop();
          _currentTrackId = null;
          _currentTrackTitle = null;
          _currentTrackUrl = null;
          _socket!.emit('playback_stopped', {'trackId': null});
          break;

        case 'set_volume':
          final volume = (payload['volume'] as num?)?.toDouble() ?? 80;
          await _audio.setVolume(volume / 100);
          break;
      }
    });
  }

  String _extractTitle(String url) {
    try {
      final uri = Uri.parse(url);
      final segments = uri.pathSegments;
      if (segments.isNotEmpty) {
        final filename = segments.last;
        return filename.split('.').first.replaceAll('-', ' ').replaceAll('_', ' ');
      }
    } catch (_) {}
    return 'Unknown Track';
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (isConnected) _socket!.emit('heartbeat');
    });
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
  }

  void disconnect() {
    _stopHeartbeat();
    _socket?.disconnect();
    _socket = null;
  }
}