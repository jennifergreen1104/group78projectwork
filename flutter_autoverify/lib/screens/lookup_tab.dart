import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

class LookupTab extends StatefulWidget {
  const LookupTab({super.key});

  @override
  State<LookupTab> createState() => _LookupTabState();
}

class _LookupTabState extends State<LookupTab> {
  final _plateController = TextEditingController();
  Map<String, dynamic>? _vehicle;
  bool _loading = false;
  String _error = '';

  void _search() async {
    if (_plateController.text.isEmpty) return;
    setState(() { _loading = true; _error = ''; _vehicle = null; });
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final v = await api.fetchVehicle(_plateController.text, auth.token!);
      setState(() => _vehicle = v);
    } catch (e) {
      setState(() => _error = 'Vehicle not found');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Plate Lookup', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
          const Text('Instant vehicle verification', style: TextStyle(color: Colors.white38)),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _plateController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(LucideIcons.search, size: 20),
                    hintText: 'ENTER PLATE',
                    filled: true,
                    fillColor: const Color(0xFF151619),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                decoration: BoxDecoration(color: const Color(0xFF151619), borderRadius: BorderRadius.circular(16)),
                child: IconButton(onPressed: () {}, icon: const Icon(LucideIcons.camera)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _search,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.black, padding: const EdgeInsets.all(18), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
              child: _loading ? const CircularProgressIndicator(color: Colors.black) : const Text('VERIFY VEHICLE', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 24),
          if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
          if (_vehicle != null) _buildVehicleCard(),
        ],
      ),
    );
  }

  Widget _buildVehicleCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: const Color(0xFF151619), borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.white.withOpacity(0.05))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('REGISTRATION', style: TextStyle(fontSize: 10, color: Colors.white30, fontWeight: FontWeight.bold)),
                  Text(_vehicle!['plate_number'], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                ],
              ),
              Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: const Text('VERIFIED', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold))),
            ],
          ),
          const Divider(height: 48, color: Colors.white10),
          _buildInfoRow('OWNER', _vehicle!['owner_name']),
          const SizedBox(height: 16),
          _buildInfoRow('VEHICLE', '${_vehicle!['make']} ${_vehicle!['model']}'),
          const SizedBox(height: 16),
          _buildInfoRow('INSURANCE', _vehicle!['insurance_company']),
          const SizedBox(height: 16),
          _buildInfoRow('EXPIRY', _vehicle!['insurance_expiry'], color: Colors.green),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.white30, fontWeight: FontWeight.bold)),
        Text(value, style: TextStyle(fontSize: 16, color: color ?? Colors.white)),
      ],
    );
  }
}
