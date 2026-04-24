import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

class FlagTab extends StatefulWidget {
  const FlagTab({super.key});

  @override
  State<FlagTab> createState() => _FlagTabState();
}

class _FlagTabState extends State<FlagTab> {
  final _plateController = TextEditingController();
  final _notesController = TextEditingController();
  List<dynamic> _flags = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadFlags();
  }

  void _loadFlags() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final f = await api.fetchFlags(auth.token!);
      setState(() { _flags = f; _loading = false; });
    } catch (e) {}
  }

  void _submitFlag() async {
    if (_plateController.text.isEmpty || _notesController.text.isEmpty) return;
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final auth = Provider.of<AuthProvider>(context, listen: false);
      await api.flagVehicle(_plateController.text, _notesController.text, auth.token!);
      _plateController.clear();
      _notesController.clear();
      _loadFlags();
    } catch (e) {}
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Flag Vehicle', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
          const Text('Alert other officers', style: TextStyle(color: Colors.white38)),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: const Color(0xFF151619), borderRadius: BorderRadius.circular(24)),
            child: Column(
              children: [
                TextField(controller: _plateController, decoration: const InputDecoration(labelText: 'PLATE NUMBER')),
                const SizedBox(height: 16),
                TextField(controller: _notesController, maxLines: 3, decoration: const InputDecoration(labelText: 'SUSPICION NOTES')),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submitFlag,
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, padding: const EdgeInsets.all(18), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                    child: const Text('BROADCAST ALERT', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 48),
          const Text('ACTIVE ALERTS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white30, letterSpacing: 2)),
          const SizedBox(height: 16),
          if (_loading) const Center(child: CircularProgressIndicator()) else ..._flags.map((flag) => _buildFlagItem(flag)),
        ],
      ),
    );
  }

  Widget _buildFlagItem(Map<String, dynamic> flag) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.red.withOpacity(0.05), border: Border.all(color: Colors.red.withOpacity(0.1)), borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Text(flag['plate_number'], style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              Text(flag['timestamp'].toString().substring(11, 16), style: const TextStyle(fontSize: 10, color: Colors.white24)),
            ],
          ),
          const SizedBox(height: 8),
          Text(flag['suspicion_notes'], style: const TextStyle(fontSize: 14, color: Colors.white70)),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(LucideIcons.user, size: 10, color: Colors.white24),
              const SizedBox(width: 4),
              Text('OFFICER ${flag['officer_name']}', style: const TextStyle(fontSize: 10, color: Colors.white24, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }
}
