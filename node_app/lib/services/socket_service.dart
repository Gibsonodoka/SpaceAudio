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

  final StreamController<String> _statusController =
      StreamController<String>.broadcast();
  final StreamController<String> _commandController =
      StreamController<String>.broadcast();

  Stream<String> get statusStream => _statusController.stream;
  Stream<String> get commandStream => _commandController.stream;

  bool get isConnected => _socket?.connected ?? false;

  void connect(String token) {
    _socket = IO.io(
      Constants.apiUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableReconnection()
          .setReconnectionAttempts(999)
          .setReconnectionDelay(3000)
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

    _socket!.on('heartbeat_ack', (_) {
      // Server acknowledged heartbeat
    });

    // Listen for commands from admin
    _socket!.on('command', (data) async {
      final command = data['command'] as String;
      final payload = data['payload'] ?? {};

      print('Received command: $command');
      _commandController.add(command);

      switch (command) {
        case 'play':
          final url = payload['url'] as String?;
          if (url != null && url.isNotEmpty) {
            await _audio.play(url);
            _socket!.emit('playback_started', {'trackId': payload['trackId']});
          }
          break;

        case 'pause':
          await _audio.pause();
          break;

        case 'stop':
          await _audio.stop();
          _socket!.emit('playback_stopped', {'trackId': null});
          break;

        case 'set_volume':
          final volume = (payload['volume'] as num?)?.toDouble() ?? 80;
          await _audio.setVolume(volume / 100);
          break;
      }
    });
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (isConnected) {
        _socket!.emit('heartbeat');
      }
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