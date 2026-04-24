import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _loginIdController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String _error = '';

  void _login() async {
    setState(() => _loading = true);
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final result = await api.login(_loginIdController.text.trim(), _passwordController.text);
      
      if (result.containsKey('token')) {
        await auth.setAuth(result['token'], result['user']['username']);
      } else {
        setState(() => _error = result['message'] ?? 'Invalid credentials');
      }
    } catch (e) {
      setState(() => _error = 'Connection error');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
                ),
                child: const Icon(LucideIcons.shieldCheck, color: Color(0xFF10B981), size: 48),
              ),
              const SizedBox(height: 24),
              const Text('AutoVerify GH', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const Text('Ghana Police Service Portal', style: TextStyle(color: Colors.white38, fontSize: 13, fontStyle: FontStyle.italic)),
              const SizedBox(height: 48),
              TextField(
                controller: _loginIdController,
                decoration: const InputDecoration(labelText: 'OFFICER SERVICE ID / USERNAME', labelStyle: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'PASSWORD', labelStyle: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ),
              if (_error.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 16), child: Text(_error, style: const TextStyle(color: Colors.red, fontSize: 12))),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _login,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.black, padding: const EdgeInsets.all(20), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                  child: _loading ? const CircularProgressIndicator(color: Colors.black) : const Text('AUTHENTICATE', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
