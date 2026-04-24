import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

class HistoryTab extends StatefulWidget {
  const HistoryTab({super.key});

  @override
  State<HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<HistoryTab> {
  List<dynamic> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  void _loadHistory() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final h = await api.fetchHistory(auth.token!);
      setState(() { _history = h; _loading = false; });
    } catch (e) {}
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Search History', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
          const Text('Your recent lookups', style: TextStyle(color: Colors.white38)),
          const SizedBox(height: 32),
          if (_loading) const Center(child: CircularProgressIndicator()) else ..._history.map((item) => _buildHistoryItem(item)),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(Map<String, dynamic> item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF151619), borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)), child: const Icon(LucideIcons.car, size: 20, color: Colors.white24)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item['plate_number'], style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                Text('${item['make'] ?? ''} ${item['model'] ?? ''}', style: const TextStyle(fontSize: 10, color: Colors.white24)),
              ],
            ),
          ),
          Text(item['timestamp'].toString().substring(0, 10), style: const TextStyle(fontSize: 10, color: Colors.white24)),
        ],
      ),
    );
  }
}
