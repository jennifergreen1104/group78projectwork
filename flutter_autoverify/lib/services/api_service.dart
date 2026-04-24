import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Update this to your real backend URL
  static const String baseUrl = 'http://localhost:3000/api';

  Future<Map<String, dynamic>> login(String loginId, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'loginId': loginId, 'password': password}),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> fetchVehicle(String plate, String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/vehicles/$plate'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Vehicle not found');
    }
  }

  Future<List<dynamic>> fetchHistory(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/history'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }

  Future<void> flagVehicle(String plate, String notes, String token) async {
    await http.post(
      Uri.parse('$baseUrl/flags'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'plate_number': plate, 'suspicion_notes': notes}),
    );
  }

  Future<List<dynamic>> fetchFlags(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/flags'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }
}
