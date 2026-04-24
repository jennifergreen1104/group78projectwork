import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'lookup_tab.dart';
import 'history_tab.dart';
import 'flag_tab.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _tabs = [
    const LookupTab(),
    const HistoryTab(),
    const FlagTab(),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
              ),
              child: const Icon(LucideIcons.shieldCheck, color: Color(0xFF10B981), size: 20),
            ),
            const SizedBox(width: 12),
            const Text('AutoVerify', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => auth.logout(),
            icon: const Icon(LucideIcons.logOut),
          ),
        ],
      ),
      body: _tabs[_currentIndex],
      bottomNavigationBar: Container(
        margin: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF151619).withOpacity(0.9),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: _currentIndex == 2 ? Colors.red : const Color(0xFF10B981),
          unselectedItemColor: Colors.white24,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(icon: Icon(LucideIcons.search), label: 'LOOKUP'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.history), label: 'HISTORY'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.flag), label: 'FLAG'),
          ],
        ),
      ),
    );
  }
}
