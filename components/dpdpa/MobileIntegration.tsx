'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  CheckCircle, 
  Smartphone,
  Server,
  Shield,
  Code,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface MobileIntegrationProps {
  widgetId: string;
  domain: string;
}

export function MobileIntegration({ widgetId, domain }: MobileIntegrationProps) {
  const [copied, setCopied] = useState<string>('');
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://www.consently.in';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(''), 2000);
  };

  // API Endpoint Documentation
  const getConfigEndpoint = `GET ${apiBaseUrl}/api/dpdpa/widget-public/${widgetId}`;
  const postConsentEndpoint = `POST ${apiBaseUrl}/api/dpdpa/consent-record`;

  // React Native Example
  const getReactNativeExample = () => {
    return `// ConsentlySDK.ts - React Native Integration
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import 'react-native-get-random-values'; // Required for uuid
import { v4 as uuidv4 } from 'uuid';

const API_BASE = '${apiBaseUrl}';
const WIDGET_ID = '${widgetId}';
const STORAGE_KEY = 'consently_visitor_id';

interface ConsentConfig {
  widgetId: string;
  activities: Array<{
    id: string;
    activity_name: string;
    purposes: Array<{
      id: string;
      purposeName: string;
      legalBasis: string;
    }>;
  }>;
  privacyNoticeHTML: string;
}

interface ConsentPayload {
  widgetId: string;
  visitorId: string;
  consentStatus: 'accepted' | 'rejected' | 'partial';
  acceptedActivities: string[];
  rejectedActivities: string[];
  activityConsents: Record<string, { status: string; timestamp: string }>;
  metadata: {
    deviceType: 'Mobile' | 'Tablet';
    os: string;
    language: string;
  };
  visitorEmail?: string;
  consentSource: 'mobile_sdk'; // Track that this came from mobile SDK
}

class ConsentlySDK {
  private visitorId: string | null = null;

  // Initialize and get/create visitor ID
  async init(): Promise<string> {
    let id = await AsyncStorage.getItem(STORAGE_KEY);
    if (!id) {
      // Generate CNST-XXXX-XXXX-XXXX format
      const uuid = uuidv4().replace(/-/g, '').substring(0, 12);
      id = \`CNST-\${uuid.substring(0, 4)}-\${uuid.substring(4, 8)}-\${uuid.substring(8, 12)}\`.toUpperCase();
      await AsyncStorage.setItem(STORAGE_KEY, id);
    }
    this.visitorId = id;
    return id;
  }

  // Fetch widget configuration
  async getConfig(): Promise<ConsentConfig> {
    const response = await fetch(\`\${API_BASE}/api/dpdpa/widget-public/\${WIDGET_ID}\`);
    if (!response.ok) throw new Error('Failed to fetch consent config');
    return response.json();
  }

  // Record consent
  async recordConsent(
    status: 'accepted' | 'rejected' | 'partial',
    acceptedActivities: string[],
    rejectedActivities: string[],
    email?: string
  ): Promise<void> {
    if (!this.visitorId) await this.init();

    const activityConsents: Record<string, { status: string; timestamp: string }> = {};
    const timestamp = new Date().toISOString();
    
    acceptedActivities.forEach(id => {
      activityConsents[id] = { status: 'accepted', timestamp };
    });
    rejectedActivities.forEach(id => {
      activityConsents[id] = { status: 'rejected', timestamp };
    });

    const payload: ConsentPayload = {
      widgetId: WIDGET_ID,
      visitorId: this.visitorId!,
      consentStatus: status,
      acceptedActivities,
      rejectedActivities,
      activityConsents,
      metadata: {
        deviceType: Platform.OS === 'ios' || Platform.OS === 'android' ? 'Mobile' : 'Tablet',
        os: \`\${Platform.OS} \${Platform.Version}\`,
        language: 'en', // Use i18n library for actual language
      },
      visitorEmail: email,
      consentSource: 'mobile_sdk', // Track consent source for analytics
    };

    const response = await fetch(\`\${API_BASE}/api/dpdpa/consent-record\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to record consent');
    
    // Store consent locally
    await AsyncStorage.setItem('consently_consent', JSON.stringify({
      status,
      acceptedActivities,
      rejectedActivities,
      timestamp,
    }));
  }

  // Check if consent is already given
  async hasConsent(): Promise<boolean> {
    const consent = await AsyncStorage.getItem('consently_consent');
    return consent !== null;
  }

  // Get stored consent
  async getStoredConsent() {
    const consent = await AsyncStorage.getItem('consently_consent');
    return consent ? JSON.parse(consent) : null;
  }

  // Clear consent (for withdrawal)
  async clearConsent(): Promise<void> {
    await AsyncStorage.removeItem('consently_consent');
  }
}

export const consentlySDK = new ConsentlySDK();`;
  };

  // Flutter Example
  const getFlutterExample = () => {
    return `// consently_sdk.dart - Flutter Integration
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'dart:io' show Platform;

class ConsentlySDK {
  static const String _apiBase = '${apiBaseUrl}';
  static const String _widgetId = '${widgetId}';
  static const String _storageKey = 'consently_visitor_id';
  
  String? _visitorId;

  // Initialize and get/create visitor ID
  Future<String> init() async {
    final prefs = await SharedPreferences.getInstance();
    String? id = prefs.getString(_storageKey);
    
    if (id == null) {
      // Generate CNST-XXXX-XXXX-XXXX format
      final uuid = const Uuid().v4().replaceAll('-', '').substring(0, 12);
      id = 'CNST-\${uuid.substring(0, 4)}-\${uuid.substring(4, 8)}-\${uuid.substring(8, 12)}'.toUpperCase();
      await prefs.setString(_storageKey, id);
    }
    
    _visitorId = id;
    return id;
  }

  // Fetch widget configuration
  Future<Map<String, dynamic>> getConfig() async {
    final response = await http.get(
      Uri.parse('\$_apiBase/api/dpdpa/widget-public/\$_widgetId'),
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch consent config');
    }
    
    return jsonDecode(response.body);
  }

  // Record consent
  Future<void> recordConsent({
    required String status,
    required List<String> acceptedActivities,
    required List<String> rejectedActivities,
    String? email,
  }) async {
    if (_visitorId == null) await init();
    
    final timestamp = DateTime.now().toUtc().toIso8601String();
    final activityConsents = <String, Map<String, String>>{};
    
    for (final id in acceptedActivities) {
      activityConsents[id] = {'status': 'accepted', 'timestamp': timestamp};
    }
    for (final id in rejectedActivities) {
      activityConsents[id] = {'status': 'rejected', 'timestamp': timestamp};
    }

    final payload = {
      'widgetId': _widgetId,
      'visitorId': _visitorId,
      'consentStatus': status,
      'acceptedActivities': acceptedActivities,
      'rejectedActivities': rejectedActivities,
      'activityConsents': activityConsents,
      'metadata': {
        'deviceType': 'Mobile',
        'os': '\${Platform.operatingSystem} \${Platform.operatingSystemVersion}',
        'language': Platform.localeName.split('_').first,
      },
      if (email != null) 'visitorEmail': email,
      'consentSource': 'mobile_sdk', // Track consent source for analytics
    };

    final response = await http.post(
      Uri.parse('\$_apiBase/api/dpdpa/consent-record'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to record consent');
    }
    
    // Store consent locally
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('consently_consent', jsonEncode({
      'status': status,
      'acceptedActivities': acceptedActivities,
      'rejectedActivities': rejectedActivities,
      'timestamp': timestamp,
    }));
  }

  // Check if consent is already given
  Future<bool> hasConsent() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey('consently_consent');
  }

  // Get stored consent
  Future<Map<String, dynamic>?> getStoredConsent() async {
    final prefs = await SharedPreferences.getInstance();
    final consent = prefs.getString('consently_consent');
    return consent != null ? jsonDecode(consent) : null;
  }

  // Clear consent (for withdrawal)
  Future<void> clearConsent() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('consently_consent');
  }
}

// Singleton instance
final consentlySDK = ConsentlySDK();`;
  };

  // iOS Swift Example
  const getSwiftExample = () => {
    return `// ConsentlySDK.swift - iOS Integration
import Foundation

class ConsentlySDK {
    static let shared = ConsentlySDK()
    
    private let apiBase = "${apiBaseUrl}"
    private let widgetId = "${widgetId}"
    private let storageKey = "consently_visitor_id"
    
    private var visitorId: String?
    
    private init() {}
    
    // MARK: - Initialization
    
    func initialize() -> String {
        if let id = UserDefaults.standard.string(forKey: storageKey) {
            visitorId = id
            return id
        }
        
        // Generate CNST-XXXX-XXXX-XXXX format
        let uuid = UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(12)
        let id = "CNST-\\(uuid.prefix(4))-\\(uuid.dropFirst(4).prefix(4))-\\(uuid.dropFirst(8).prefix(4))".uppercased()
        
        UserDefaults.standard.set(id, forKey: storageKey)
        visitorId = id
        return id
    }
    
    // MARK: - Fetch Configuration
    
    func getConfig(completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\\(apiBase)/api/dpdpa/widget-public/\\(widgetId)") else {
            completion(.failure(NSError(domain: "ConsentlySDK", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                completion(.failure(NSError(domain: "ConsentlySDK", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])))
                return
            }
            
            completion(.success(json))
        }.resume()
    }
    
    // MARK: - Record Consent
    
    func recordConsent(
        status: String,
        acceptedActivities: [String],
        rejectedActivities: [String],
        email: String? = nil,
        completion: @escaping (Result<Void, Error>) -> Void
    ) {
        if visitorId == nil {
            _ = initialize()
        }
        
        guard let url = URL(string: "\\(apiBase)/api/dpdpa/consent-record") else {
            completion(.failure(NSError(domain: "ConsentlySDK", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        let timestamp = ISO8601DateFormatter().string(from: Date())
        var activityConsents: [String: [String: String]] = [:]
        
        for id in acceptedActivities {
            activityConsents[id] = ["status": "accepted", "timestamp": timestamp]
        }
        for id in rejectedActivities {
            activityConsents[id] = ["status": "rejected", "timestamp": timestamp]
        }
        
        var payload: [String: Any] = [
            "widgetId": widgetId,
            "visitorId": visitorId!,
            "consentStatus": status,
            "acceptedActivities": acceptedActivities,
            "rejectedActivities": rejectedActivities,
            "activityConsents": activityConsents,
            "metadata": [
                "deviceType": UIDevice.current.userInterfaceIdiom == .pad ? "Tablet" : "Mobile",
                "os": "iOS \\(UIDevice.current.systemVersion)",
                "language": Locale.current.languageCode ?? "en"
            ]
        ]
        
        if let email = email {
            payload["visitorEmail"] = email
        }
        
        // Track consent source for analytics
        payload["consentSource"] = "mobile_sdk"
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            // Store consent locally
            let consent: [String: Any] = [
                "status": status,
                "acceptedActivities": acceptedActivities,
                "rejectedActivities": rejectedActivities,
                "timestamp": timestamp
            ]
            
            if let consentData = try? JSONSerialization.data(withJSONObject: consent) {
                UserDefaults.standard.set(consentData, forKey: "consently_consent")
            }
            
            completion(.success(()))
        }.resume()
    }
    
    // MARK: - Consent Status
    
    func hasConsent() -> Bool {
        return UserDefaults.standard.data(forKey: "consently_consent") != nil
    }
    
    func getStoredConsent() -> [String: Any]? {
        guard let data = UserDefaults.standard.data(forKey: "consently_consent"),
              let consent = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return consent
    }
    
    func clearConsent() {
        UserDefaults.standard.removeObject(forKey: "consently_consent")
    }
}`;
  };

  // Android Kotlin Example
  const getKotlinExample = () => {
    return `// ConsentlySDK.kt - Android Integration
package com.yourapp.consently

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

class ConsentlySDK private constructor(private val context: Context) {
    
    companion object {
        private const val API_BASE = "${apiBaseUrl}"
        private const val WIDGET_ID = "${widgetId}"
        private const val PREFS_NAME = "consently_prefs"
        private const val STORAGE_KEY = "consently_visitor_id"
        
        @Volatile
        private var instance: ConsentlySDK? = null
        
        fun getInstance(context: Context): ConsentlySDK {
            return instance ?: synchronized(this) {
                instance ?: ConsentlySDK(context.applicationContext).also { instance = it }
            }
        }
    }
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private var visitorId: String? = null
    
    // Initialize and get/create visitor ID
    fun initialize(): String {
        var id = prefs.getString(STORAGE_KEY, null)
        
        if (id == null) {
            // Generate CNST-XXXX-XXXX-XXXX format
            val uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 12)
            id = "CNST-\${uuid.substring(0, 4)}-\${uuid.substring(4, 8)}-\${uuid.substring(8, 12)}".uppercase()
            prefs.edit().putString(STORAGE_KEY, id).apply()
        }
        
        visitorId = id
        return id
    }
    
    // Fetch widget configuration
    suspend fun getConfig(): JSONObject = withContext(Dispatchers.IO) {
        val url = URL("\$API_BASE/api/dpdpa/widget-public/\$WIDGET_ID")
        val connection = url.openConnection() as HttpURLConnection
        
        try {
            connection.requestMethod = "GET"
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            
            if (connection.responseCode != 200) {
                throw Exception("Failed to fetch consent config: \${connection.responseCode}")
            }
            
            val response = connection.inputStream.bufferedReader().readText()
            JSONObject(response)
        } finally {
            connection.disconnect()
        }
    }
    
    // Record consent
    suspend fun recordConsent(
        status: String,
        acceptedActivities: List<String>,
        rejectedActivities: List<String>,
        email: String? = null
    ) = withContext(Dispatchers.IO) {
        if (visitorId == null) initialize()
        
        val url = URL("\$API_BASE/api/dpdpa/consent-record")
        val connection = url.openConnection() as HttpURLConnection
        
        try {
            val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.format(Date())
            
            val activityConsents = JSONObject()
            acceptedActivities.forEach { id ->
                activityConsents.put(id, JSONObject().apply {
                    put("status", "accepted")
                    put("timestamp", timestamp)
                })
            }
            rejectedActivities.forEach { id ->
                activityConsents.put(id, JSONObject().apply {
                    put("status", "rejected")
                    put("timestamp", timestamp)
                })
            }
            
            val payload = JSONObject().apply {
                put("widgetId", WIDGET_ID)
                put("visitorId", visitorId)
                put("consentStatus", status)
                put("acceptedActivities", JSONArray(acceptedActivities))
                put("rejectedActivities", JSONArray(rejectedActivities))
                put("activityConsents", activityConsents)
                put("metadata", JSONObject().apply {
                    put("deviceType", if (isTablet()) "Tablet" else "Mobile")
                    put("os", "Android \${Build.VERSION.RELEASE}")
                    put("language", Locale.getDefault().language)
                })
                email?.let { put("visitorEmail", it) }
                put("consentSource", "mobile_sdk") // Track consent source for analytics
            }
            
            connection.apply {
                requestMethod = "POST"
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                connectTimeout = 10000
                readTimeout = 10000
            }
            
            connection.outputStream.bufferedWriter().use { it.write(payload.toString()) }
            
            if (connection.responseCode != 200) {
                throw Exception("Failed to record consent: \${connection.responseCode}")
            }
            
            // Store consent locally
            val consent = JSONObject().apply {
                put("status", status)
                put("acceptedActivities", JSONArray(acceptedActivities))
                put("rejectedActivities", JSONArray(rejectedActivities))
                put("timestamp", timestamp)
            }
            prefs.edit().putString("consently_consent", consent.toString()).apply()
            
        } finally {
            connection.disconnect()
        }
    }
    
    // Check if consent is already given
    fun hasConsent(): Boolean {
        return prefs.contains("consently_consent")
    }
    
    // Get stored consent
    fun getStoredConsent(): JSONObject? {
        val consent = prefs.getString("consently_consent", null) ?: return null
        return JSONObject(consent)
    }
    
    // Clear consent (for withdrawal)
    fun clearConsent() {
        prefs.edit().remove("consently_consent").apply()
    }
    
    private fun isTablet(): Boolean {
        val metrics = context.resources.displayMetrics
        val widthInches = metrics.widthPixels / metrics.xdpi
        val heightInches = metrics.heightPixels / metrics.ydpi
        val diagonalInches = kotlin.math.sqrt((widthInches * widthInches + heightInches * heightInches).toDouble())
        return diagonalInches >= 7.0
    }
}`;
  };

  // API Request/Response Example
  const getApiExample = () => {
    return `// API Endpoints Documentation

// 1. GET Widget Configuration
// Endpoint: GET ${apiBaseUrl}/api/dpdpa/widget-public/${widgetId}
// Headers: None required (public endpoint)
// Response:
{
  "widgetId": "${widgetId}",
  "name": "DPDPA Consent Widget",
  "domain": "${domain}",
  "activities": [
    {
      "id": "uuid-activity-1",
      "activity_name": "Analytics Tracking",
      "purposes": [
        {
          "id": "uuid-purpose-1",
          "purposeId": "uuid",
          "purposeName": "Service Improvement",
          "legalBasis": "consent",
          "dataCategories": [
            { "categoryName": "Usage Data", "retentionPeriod": "12 months" }
          ]
        }
      ]
    }
  ],
  "privacyNoticeHTML": "<div>...</div>"
}

// 2. POST Consent Record
// Endpoint: POST ${apiBaseUrl}/api/dpdpa/consent-record
// Headers: Content-Type: application/json
// Request Body:
{
  "widgetId": "${widgetId}",
  "visitorId": "CNST-XXXX-XXXX-XXXX",  // Your generated Consent ID
  "consentStatus": "accepted",          // "accepted" | "rejected" | "partial"
  "acceptedActivities": ["uuid-1", "uuid-2"],
  "rejectedActivities": [],
  "activityConsents": {
    "uuid-1": { "status": "accepted", "timestamp": "2025-01-19T10:00:00Z" },
    "uuid-2": { "status": "accepted", "timestamp": "2025-01-19T10:00:00Z" }
  },
  "metadata": {
    "deviceType": "Mobile",
    "os": "iOS 17.2",
    "language": "en"
  },
  "visitorEmail": "user@example.com",   // Optional: for cross-device sync
  "consentSource": "mobile_sdk"         // Required: tracks consent origin
}

// Response:
{
  "success": true,
  "consentId": "uuid-consent-record",
  "visitorId": "CNST-XXXX-XXXX-XXXX",
  "expiresAt": "2026-01-19T10:00:00Z",
  "message": "Consent recorded successfully"
}`;
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-purple-900">Mobile App SDK</CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">New</Badge>
        </div>
        <CardDescription className="text-purple-700">
          Integrate DPDPA consent into your iOS, Android, React Native, or Flutter mobile applications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-200">
            <div className="bg-purple-100 p-2 rounded">
              <Server className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">REST API</h4>
              <p className="text-xs text-gray-600">Simple HTTP endpoints</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-200">
            <div className="bg-purple-100 p-2 rounded">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">CORS Enabled</h4>
              <p className="text-xs text-gray-600">Works from any origin</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-200">
            <div className="bg-purple-100 p-2 rounded">
              <Code className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Widget ID</h4>
              <p className="text-xs text-gray-600 font-mono truncate">{widgetId}</p>
            </div>
          </div>
        </div>

        {/* Platform Tabs */}
        <Tabs defaultValue="react-native" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="react-native">React Native</TabsTrigger>
            <TabsTrigger value="flutter">Flutter</TabsTrigger>
            <TabsTrigger value="ios">iOS Swift</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
            <TabsTrigger value="api">API Docs</TabsTrigger>
          </TabsList>

          {/* React Native */}
          <TabsContent value="react-native">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-gray-900">React Native SDK</h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(getReactNativeExample(), 'React Native code')}
                >
                  {copied === 'React Native code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy
                </Button>
              </div>
              <div className="text-xs text-gray-600 mb-3 p-2 bg-amber-50 rounded border border-amber-200">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Required packages: <code className="bg-amber-100 px-1 rounded">@react-native-async-storage/async-storage</code>, <code className="bg-amber-100 px-1 rounded">uuid</code>, <code className="bg-amber-100 px-1 rounded">react-native-get-random-values</code>
              </div>
              <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-96">
                <code>{getReactNativeExample()}</code>
              </pre>
            </div>
          </TabsContent>

          {/* Flutter */}
          <TabsContent value="flutter">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Flutter SDK</h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(getFlutterExample(), 'Flutter code')}
                >
                  {copied === 'Flutter code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy
                </Button>
              </div>
              <div className="text-xs text-gray-600 mb-3 p-2 bg-amber-50 rounded border border-amber-200">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Required packages: <code className="bg-amber-100 px-1 rounded">http</code>, <code className="bg-amber-100 px-1 rounded">shared_preferences</code>, <code className="bg-amber-100 px-1 rounded">uuid</code>
              </div>
              <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-96">
                <code>{getFlutterExample()}</code>
              </pre>
            </div>
          </TabsContent>

          {/* iOS Swift */}
          <TabsContent value="ios">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-gray-900">iOS Swift SDK</h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(getSwiftExample(), 'Swift code')}
                >
                  {copied === 'Swift code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy
                </Button>
              </div>
              <div className="text-xs text-gray-600 mb-3 p-2 bg-amber-50 rounded border border-amber-200">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Minimum iOS version: 13.0. Uses Foundation, UIKit, and UserDefaults for storage.
              </div>
              <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-96">
                <code>{getSwiftExample()}</code>
              </pre>
            </div>
          </TabsContent>

          {/* Android Kotlin */}
          <TabsContent value="android">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Android Kotlin SDK</h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(getKotlinExample(), 'Kotlin code')}
                >
                  {copied === 'Kotlin code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy
                </Button>
              </div>
              <div className="text-xs text-gray-600 mb-3 p-2 bg-amber-50 rounded border border-amber-200">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Requires <code className="bg-amber-100 px-1 rounded">kotlinx-coroutines</code> for async operations. Add <code className="bg-amber-100 px-1 rounded">INTERNET</code> permission in AndroidManifest.xml.
              </div>
              <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-96">
                <code>{getKotlinExample()}</code>
              </pre>
            </div>
          </TabsContent>

          {/* API Documentation */}
          <TabsContent value="api">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-gray-900">REST API Documentation</h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(getApiExample(), 'API docs')}
                >
                  {copied === 'API docs' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-xs text-gray-500 mb-1">GET Configuration</p>
                  <code className="text-xs text-purple-700 break-all">{getConfigEndpoint}</code>
                </div>
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-xs text-gray-500 mb-1">POST Consent</p>
                  <code className="text-xs text-purple-700 break-all">{postConsentEndpoint}</code>
                </div>
              </div>
              <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-96">
                <code>{getApiExample()}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        {/* Implementation Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Implementation Checklist
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>1. Generate unique Consent ID (CNST-XXXX-XXXX-XXXX)</li>
              <li>2. Fetch widget config on app launch</li>
              <li>3. Display consent UI with activities</li>
              <li>4. Record consent with proper metadata</li>
              <li>5. Store consent locally for offline access</li>
              <li>6. Handle consent expiration</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Important Notes
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>- Consent ID must be persistent across app sessions</li>
              <li>- Include device metadata for analytics</li>
              <li>- Email is optional but enables cross-device sync</li>
              <li>- Handle network errors gracefully</li>
              <li>- Test consent flow before production</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
