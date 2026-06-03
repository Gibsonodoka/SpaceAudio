import 'package:flutter/material.dart';
import '../services/socket_service.dart';
import '../services/audio_service.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final SocketService _socket = SocketService();
  final AudioPlayerService _audio = AudioPlayerService();

  String _connectionStatus = 'connecting';
  String _lastCommand = 'none';
  String? _currentTrackTitle;

  @override
  void initState() {
    super.initState();

    _socket.statusStream.listen((status) {
      if (mounted) setState(() => _connectionStatus = status);
    });

    _socket.commandStream.listen((data) {
      final command = data['command'] as String;
      final payload = data['payload'] ?? {};
      if (mounted) {
        setState(() {
          _lastCommand = command;
          if (command == 'play') {
            _currentTrackTitle = payload['trackTitle'] ??
                _socket.currentTrackTitle ?? 'Playing...';
          } else if (command == 'stop') {
            _currentTrackTitle = null;
          }
        });
      }
    });
  }

  Future<void> _logout() async {
    _socket.disconnect();
    await AuthService.clearToken();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  Color get _statusColor {
    switch (_connectionStatus) {
      case 'connected': return Colors.greenAccent;
      case 'disconnected': return Colors.redAccent;
      default: return Colors.orangeAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0F),
        title: const Text('AUD Node',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.grey),
            onPressed: _logout,
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Connection status card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _statusColor.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  Icon(
                    _connectionStatus == 'connected' ? Icons.wifi : Icons.wifi_off,
                    color: _statusColor,
                    size: 48,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _connectionStatus.toUpperCase(),
                    style: TextStyle(
                      color: _statusColor,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _connectionStatus == 'connected'
                        ? 'Awaiting commands from admin'
                        : 'Reconnecting...',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Now playing card
            StreamBuilder(
              stream: _audio.player.playerStateStream,
              builder: (context, snapshot) {
                final isPlaying = snapshot.data?.playing ?? false;

                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A1A2E),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isPlaying
                          ? const Color(0xFF6366F1).withOpacity(0.4)
                          : Colors.transparent,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isPlaying
                              ? const Color(0xFF6366F1).withOpacity(0.2)
                              : Colors.grey.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          isPlaying
                              ? Icons.graphic_eq_rounded
                              : Icons.music_note_outlined,
                          color: isPlaying
                              ? const Color(0xFF6366F1)
                              : Colors.grey,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isPlaying ? 'Now Playing' : 'Idle',
                              style: const TextStyle(
                                color: Colors.grey,
                                fontSize: 11,
                                letterSpacing: 1,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isPlaying
                                  ? (_currentTrackTitle ?? 'Playing...')
                                  : 'Waiting for play command',
                              style: TextStyle(
                                color: isPlaying ? Colors.white : Colors.grey,
                                fontWeight: isPlaying
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                fontSize: 15,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (isPlaying)
                        const Icon(Icons.volume_up,
                            color: Color(0xFF6366F1), size: 20),
                    ],
                  ),
                );
              },
            ),

            const SizedBox(height: 20),

            // Last command card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Last Command',
                      style: TextStyle(color: Colors.grey, fontSize: 11,
                          letterSpacing: 1)),
                  const SizedBox(height: 6),
                  Text(
                    _lastCommand.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}