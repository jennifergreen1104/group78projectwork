import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider with ChangeNotifier {
  String? _token;
  String? _username;
  bool _isAuthenticated = false;

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  String? get username => _username;

  AuthProvider() {
    _loadAuth();
  }

  void _loadAuth() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    _username = prefs.getString('username');
    _isAuthenticated = _token != null;
    notifyListeners();
  }

  Future<void> setAuth(String token, String username) async {
    _token = token;
    _username = username;
    _isAuthenticated = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('username', username);
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _username = null;
    _isAuthenticated = false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('username');
    notifyListeners();
  }
}
