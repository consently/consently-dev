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
  AlertCircle,
  Cookie
} from 'lucide-react';
import { toast } from 'sonner';

interface CookieMobileIntegrationProps {
  widgetId: string;
  domain: string;
}

export function CookieMobileIntegration({ widgetId, domain }: CookieMobileIntegrationProps) {
  const [copied, setCopied] = useState<string>('');
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://www.consently.in';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(''), 2000);
  };

  // API Endpoint Documentation
  const getConfigEndpoint = `GET ${apiBaseUrl}/api/cookies/widget-public/${widgetId}`;
  const postConsentEndpoint = `POST ${apiBaseUrl}/api/cookies/consent-log`;

  // React Native Example
  const getReactNativeExample = () => {
    return `// CookieConsentSDK.ts - React Native Cookie Consent Integration
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = '${apiBaseUrl}';
const WIDGET_ID = '${widgetId}';
const STORAGE_KEY = 'consently_cookie_visitor';
const CONSENT_KEY = 'consently_cookie_consent';

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

interface WidgetConfig {
  widgetId: string;
  domain: string;
  categories: string[];
  theme: Record<string, any>;
  title: string;
  message: string;
  scannedCookies: {
    categories: Record<string, Array<{
      name: string;
      purpose: string;
      provider: string;
      expiry: string;
    }>>;
    totalCookies: number;
  };
}

interface ConsentPayload {
  consent_id: string;
  visitor_token: string;
  widget_id: string;
  consent_type: 'cookie';
  status: 'accepted' | 'rejected' | 'partial';
  categories: string[];
  device_info: {
    type: string;
    os: string;
    browser: string;
  };
  language: string;
  consent_method: 'api';
}

class CookieConsentSDK {
  private visitorToken: string | null = null;

  // Initialize and get/create visitor token
  async init(): Promise<string> {
    let token = await AsyncStorage.getItem(STORAGE_KEY);
    if (!token) {
      token = uuidv4();
      await AsyncStorage.setItem(STORAGE_KEY, token);
    }
    this.visitorToken = token;
    return token;
  }

  // Fetch widget configuration with cookie categories
  async getConfig(): Promise<WidgetConfig> {
    const response = await fetch(\`\${API_BASE}/api/cookies/widget-public/\${WIDGET_ID}\`);
    if (!response.ok) throw new Error('Failed to fetch cookie consent config');
    return response.json();
  }

  // Record cookie consent
  async recordConsent(
    status: 'accepted' | 'rejected' | 'partial',
    acceptedCategories: string[]
  ): Promise<void> {
    if (!this.visitorToken) await this.init();

    const consentId = \`cookie_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;

    const payload: ConsentPayload = {
      consent_id: consentId,
      visitor_token: this.visitorToken!,
      widget_id: WIDGET_ID,
      consent_type: 'cookie',
      status,
      categories: acceptedCategories,
      device_info: {
        type: Platform.OS === 'ios' || Platform.OS === 'android' ? 'Mobile' : 'Tablet',
        os: \`\${Platform.OS} \${Platform.Version}\`,
        browser: 'React Native App',
      },
      language: 'en',
      consent_method: 'api',
    };

    const response = await fetch(\`\${API_BASE}/api/cookies/consent-log\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to record cookie consent');

    // Store consent locally
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify({
      status,
      categories: acceptedCategories,
      timestamp: new Date().toISOString(),
      consentId,
    }));
  }

  // Accept all cookies
  async acceptAll(allCategories: string[]): Promise<void> {
    await this.recordConsent('accepted', allCategories);
  }

  // Reject all (keep only necessary)
  async rejectAll(): Promise<void> {
    await this.recordConsent('rejected', ['necessary']);
  }

  // Accept specific categories
  async acceptCategories(categories: string[]): Promise<void> {
    // Always include necessary
    const finalCategories = [...new Set(['necessary', ...categories])];
    await this.recordConsent('partial', finalCategories);
  }

  // Check if consent is already given
  async hasConsent(): Promise<boolean> {
    const consent = await AsyncStorage.getItem(CONSENT_KEY);
    return consent !== null;
  }

  // Get stored consent
  async getStoredConsent() {
    const consent = await AsyncStorage.getItem(CONSENT_KEY);
    return consent ? JSON.parse(consent) : null;
  }

  // Check if a specific category is allowed
  async isCategoryAllowed(category: string): Promise<boolean> {
    const consent = await this.getStoredConsent();
    if (!consent) return category === 'necessary';
    return consent.categories.includes(category);
  }

  // Clear consent (for withdrawal)
  async clearConsent(): Promise<void> {
    await AsyncStorage.removeItem(CONSENT_KEY);
  }
}

export const cookieConsentSDK = new CookieConsentSDK();`;
  };

  // Flutter Example
  const getFlutterExample = () => {
    return `// cookie_consent_sdk.dart - Flutter Cookie Consent Integration
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'dart:io' show Platform;

class CookieConsentSDK {
  static const String _apiBase = '${apiBaseUrl}';
  static const String _widgetId = '${widgetId}';
  static const String _storageKey = 'consently_cookie_visitor';
  static const String _consentKey = 'consently_cookie_consent';
  
  String? _visitorToken;

  // Initialize and get/create visitor token
  Future<String> init() async {
    final prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString(_storageKey);
    
    if (token == null) {
      token = const Uuid().v4();
      await prefs.setString(_storageKey, token);
    }
    
    _visitorToken = token;
    return token;
  }

  // Fetch widget configuration with cookie categories
  Future<Map<String, dynamic>> getConfig() async {
    final response = await http.get(
      Uri.parse('\$_apiBase/api/cookies/widget-public/\$_widgetId'),
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch cookie consent config');
    }
    
    return jsonDecode(response.body);
  }

  // Record cookie consent
  Future<void> recordConsent({
    required String status,
    required List<String> acceptedCategories,
  }) async {
    if (_visitorToken == null) await init();
    
    final consentId = 'cookie_\${DateTime.now().millisecondsSinceEpoch}_\${const Uuid().v4().substring(0, 8)}';

    final payload = {
      'consent_id': consentId,
      'visitor_token': _visitorToken,
      'widget_id': _widgetId,
      'consent_type': 'cookie',
      'status': status,
      'categories': acceptedCategories,
      'device_info': {
        'type': 'Mobile',
        'os': '\${Platform.operatingSystem} \${Platform.operatingSystemVersion}',
        'browser': 'Flutter App',
      },
      'language': Platform.localeName.split('_').first,
      'consent_method': 'api',
    };

    final response = await http.post(
      Uri.parse('\$_apiBase/api/cookies/consent-log'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to record cookie consent');
    }

    // Store consent locally
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_consentKey, jsonEncode({
      'status': status,
      'categories': acceptedCategories,
      'timestamp': DateTime.now().toUtc().toIso8601String(),
      'consentId': consentId,
    }));
  }

  // Accept all cookies
  Future<void> acceptAll(List<String> allCategories) async {
    await recordConsent(status: 'accepted', acceptedCategories: allCategories);
  }

  // Reject all (keep only necessary)
  Future<void> rejectAll() async {
    await recordConsent(status: 'rejected', acceptedCategories: ['necessary']);
  }

  // Accept specific categories
  Future<void> acceptCategories(List<String> categories) async {
    final finalCategories = {'necessary', ...categories}.toList();
    await recordConsent(status: 'partial', acceptedCategories: finalCategories);
  }

  // Check if consent is already given
  Future<bool> hasConsent() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(_consentKey);
  }

  // Get stored consent
  Future<Map<String, dynamic>?> getStoredConsent() async {
    final prefs = await SharedPreferences.getInstance();
    final consent = prefs.getString(_consentKey);
    return consent != null ? jsonDecode(consent) : null;
  }

  // Check if a specific category is allowed
  Future<bool> isCategoryAllowed(String category) async {
    final consent = await getStoredConsent();
    if (consent == null) return category == 'necessary';
    return (consent['categories'] as List).contains(category);
  }

  // Clear consent (for withdrawal)
  Future<void> clearConsent() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_consentKey);
  }
}

// Singleton instance
final cookieConsentSDK = CookieConsentSDK();`;
  };

  // iOS Swift Example
  const getSwiftExample = () => {
    return `// CookieConsentSDK.swift - iOS Cookie Consent Integration
import Foundation

class CookieConsentSDK {
    static let shared = CookieConsentSDK()
    
    private let apiBase = "${apiBaseUrl}"
    private let widgetId = "${widgetId}"
    private let storageKey = "consently_cookie_visitor"
    private let consentKey = "consently_cookie_consent"
    
    private var visitorToken: String?
    
    private init() {}
    
    // MARK: - Initialization
    
    func initialize() -> String {
        if let token = UserDefaults.standard.string(forKey: storageKey) {
            visitorToken = token
            return token
        }
        
        let token = UUID().uuidString
        UserDefaults.standard.set(token, forKey: storageKey)
        visitorToken = token
        return token
    }
    
    // MARK: - Fetch Configuration
    
    func getConfig(completion: @escaping (Result<[String: Any], Error>) -> Void) {
        guard let url = URL(string: "\\(apiBase)/api/cookies/widget-public/\\(widgetId)") else {
            completion(.failure(NSError(domain: "CookieConsentSDK", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                completion(.failure(NSError(domain: "CookieConsentSDK", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])))
                return
            }
            
            completion(.success(json))
        }.resume()
    }
    
    // MARK: - Record Consent
    
    func recordConsent(
        status: String,
        acceptedCategories: [String],
        completion: @escaping (Result<Void, Error>) -> Void
    ) {
        if visitorToken == nil {
            _ = initialize()
        }
        
        guard let url = URL(string: "\\(apiBase)/api/cookies/consent-log") else {
            completion(.failure(NSError(domain: "CookieConsentSDK", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        let consentId = "cookie_\\(Int(Date().timeIntervalSince1970 * 1000))_\\(UUID().uuidString.prefix(8))"
        
        let payload: [String: Any] = [
            "consent_id": consentId,
            "visitor_token": visitorToken!,
            "widget_id": widgetId,
            "consent_type": "cookie",
            "status": status,
            "categories": acceptedCategories,
            "device_info": [
                "type": UIDevice.current.userInterfaceIdiom == .pad ? "Tablet" : "Mobile",
                "os": "iOS \\(UIDevice.current.systemVersion)",
                "browser": "iOS App"
            ],
            "language": Locale.current.languageCode ?? "en",
            "consent_method": "api"
        ]
        
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
                "categories": acceptedCategories,
                "timestamp": ISO8601DateFormatter().string(from: Date()),
                "consentId": consentId
            ]
            
            if let consentData = try? JSONSerialization.data(withJSONObject: consent) {
                UserDefaults.standard.set(consentData, forKey: self?.consentKey ?? "")
            }
            
            completion(.success(()))
        }.resume()
    }
    
    // MARK: - Convenience Methods
    
    func acceptAll(categories: [String], completion: @escaping (Result<Void, Error>) -> Void) {
        recordConsent(status: "accepted", acceptedCategories: categories, completion: completion)
    }
    
    func rejectAll(completion: @escaping (Result<Void, Error>) -> Void) {
        recordConsent(status: "rejected", acceptedCategories: ["necessary"], completion: completion)
    }
    
    func acceptCategories(_ categories: [String], completion: @escaping (Result<Void, Error>) -> Void) {
        var finalCategories = Set(["necessary"])
        finalCategories.formUnion(categories)
        recordConsent(status: "partial", acceptedCategories: Array(finalCategories), completion: completion)
    }
    
    // MARK: - Consent Status
    
    func hasConsent() -> Bool {
        return UserDefaults.standard.data(forKey: consentKey) != nil
    }
    
    func getStoredConsent() -> [String: Any]? {
        guard let data = UserDefaults.standard.data(forKey: consentKey),
              let consent = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return consent
    }
    
    func isCategoryAllowed(_ category: String) -> Bool {
        guard let consent = getStoredConsent(),
              let categories = consent["categories"] as? [String] else {
            return category == "necessary"
        }
        return categories.contains(category)
    }
    
    func clearConsent() {
        UserDefaults.standard.removeObject(forKey: consentKey)
    }
}`;
  };

  // Android Kotlin Example
  const getKotlinExample = () => {
    return `// CookieConsentSDK.kt - Android Cookie Consent Integration
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

class CookieConsentSDK private constructor(private val context: Context) {
    
    companion object {
        private const val API_BASE = "${apiBaseUrl}"
        private const val WIDGET_ID = "${widgetId}"
        private const val PREFS_NAME = "consently_cookie_prefs"
        private const val STORAGE_KEY = "consently_cookie_visitor"
        private const val CONSENT_KEY = "consently_cookie_consent"
        
        @Volatile
        private var instance: CookieConsentSDK? = null
        
        fun getInstance(context: Context): CookieConsentSDK {
            return instance ?: synchronized(this) {
                instance ?: CookieConsentSDK(context.applicationContext).also { instance = it }
            }
        }
    }
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private var visitorToken: String? = null
    
    // Initialize and get/create visitor token
    fun initialize(): String {
        var token = prefs.getString(STORAGE_KEY, null)
        
        if (token == null) {
            token = UUID.randomUUID().toString()
            prefs.edit().putString(STORAGE_KEY, token).apply()
        }
        
        visitorToken = token
        return token
    }
    
    // Fetch widget configuration with cookie categories
    suspend fun getConfig(): JSONObject = withContext(Dispatchers.IO) {
        val url = URL("\$API_BASE/api/cookies/widget-public/\$WIDGET_ID")
        val connection = url.openConnection() as HttpURLConnection
        
        try {
            connection.requestMethod = "GET"
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            
            if (connection.responseCode != 200) {
                throw Exception("Failed to fetch cookie consent config: \${connection.responseCode}")
            }
            
            val response = connection.inputStream.bufferedReader().readText()
            JSONObject(response)
        } finally {
            connection.disconnect()
        }
    }
    
    // Record cookie consent
    suspend fun recordConsent(
        status: String,
        acceptedCategories: List<String>
    ) = withContext(Dispatchers.IO) {
        if (visitorToken == null) initialize()
        
        val url = URL("\$API_BASE/api/cookies/consent-log")
        val connection = url.openConnection() as HttpURLConnection
        
        try {
            val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.format(Date())
            
            val consentId = "cookie_\${System.currentTimeMillis()}_\${UUID.randomUUID().toString().take(8)}"
            
            val payload = JSONObject().apply {
                put("consent_id", consentId)
                put("visitor_token", visitorToken)
                put("widget_id", WIDGET_ID)
                put("consent_type", "cookie")
                put("status", status)
                put("categories", JSONArray(acceptedCategories))
                put("device_info", JSONObject().apply {
                    put("type", if (isTablet()) "Tablet" else "Mobile")
                    put("os", "Android \${Build.VERSION.RELEASE}")
                    put("browser", "Android App")
                })
                put("language", Locale.getDefault().language)
                put("consent_method", "api")
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
                throw Exception("Failed to record cookie consent: \${connection.responseCode}")
            }
            
            // Store consent locally
            val consent = JSONObject().apply {
                put("status", status)
                put("categories", JSONArray(acceptedCategories))
                put("timestamp", timestamp)
                put("consentId", consentId)
            }
            prefs.edit().putString(CONSENT_KEY, consent.toString()).apply()
            
        } finally {
            connection.disconnect()
        }
    }
    
    // Convenience methods
    suspend fun acceptAll(allCategories: List<String>) {
        recordConsent("accepted", allCategories)
    }
    
    suspend fun rejectAll() {
        recordConsent("rejected", listOf("necessary"))
    }
    
    suspend fun acceptCategories(categories: List<String>) {
        val finalCategories = (setOf("necessary") + categories).toList()
        recordConsent("partial", finalCategories)
    }
    
    // Check if consent is already given
    fun hasConsent(): Boolean {
        return prefs.contains(CONSENT_KEY)
    }
    
    // Get stored consent
    fun getStoredConsent(): JSONObject? {
        val consent = prefs.getString(CONSENT_KEY, null) ?: return null
        return JSONObject(consent)
    }
    
    // Check if a specific category is allowed
    fun isCategoryAllowed(category: String): Boolean {
        val consent = getStoredConsent() ?: return category == "necessary"
        val categories = consent.getJSONArray("categories")
        for (i in 0 until categories.length()) {
            if (categories.getString(i) == category) return true
        }
        return false
    }
    
    // Clear consent (for withdrawal)
    fun clearConsent() {
        prefs.edit().remove(CONSENT_KEY).apply()
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
    return `// Cookie Consent API Endpoints Documentation

// 1. GET Widget Configuration (includes scanned cookies)
// Endpoint: GET ${apiBaseUrl}/api/cookies/widget-public/${widgetId}
// Headers: None required (public endpoint)
// Response:
{
  "widgetId": "${widgetId}",
  "domain": "${domain}",
  "categories": ["necessary", "analytics", "marketing", "social"],
  "theme": {
    "primaryColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937"
  },
  "title": "Cookie Consent",
  "message": "We use cookies to enhance your browsing experience.",
  "acceptButton": { "text": "Accept All" },
  "rejectButton": { "text": "Reject All" },
  "scannedCookies": {
    "categories": {
      "necessary": [
        { "name": "session_id", "purpose": "Session management", "provider": "First Party", "expiry": "Session" }
      ],
      "analytics": [
        { "name": "_ga", "purpose": "Google Analytics", "provider": "Google", "expiry": "2 years" }
      ]
    },
    "totalCookies": 12,
    "lastScanned": "2025-01-19T10:00:00Z"
  }
}

// 2. POST Consent Log
// Endpoint: POST ${apiBaseUrl}/api/cookies/consent-log
// Headers: Content-Type: application/json
// Request Body:
{
  "consent_id": "cookie_1737288000000_abc123",  // Unique consent ID
  "visitor_token": "uuid-visitor-token",        // Persistent visitor identifier
  "widget_id": "${widgetId}",
  "consent_type": "cookie",
  "status": "accepted",                         // "accepted" | "rejected" | "partial"
  "categories": ["necessary", "analytics"],     // Accepted categories
  "device_info": {
    "type": "Mobile",
    "os": "iOS 17.2",
    "browser": "iOS App"
  },
  "language": "en",
  "consent_method": "api"                       // "banner" | "settings_modal" | "api"
}

// Response:
{
  "success": true,
  "data": {
    "consentLog": {
      "id": "uuid-log-id",
      "consent_id": "cookie_1737288000000_abc123",
      "status": "accepted",
      "created_at": "2025-01-19T10:00:00Z"
    }
  }
}

// Cookie Categories Reference:
// - necessary: Essential cookies (always required)
// - analytics: Performance/analytics tracking
// - marketing: Advertising/marketing cookies
// - social: Social media integration cookies
// - functional: Enhanced functionality cookies`;
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <Cookie className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-blue-900">Mobile App SDK - Cookie Consent</CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">New</Badge>
        </div>
        <CardDescription className="text-blue-700">
          Integrate cookie consent into your iOS, Android, React Native, or Flutter mobile applications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
            <div className="bg-blue-100 p-2 rounded">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">REST API</h4>
              <p className="text-xs text-gray-600">Simple HTTP endpoints</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
            <div className="bg-blue-100 p-2 rounded">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">CORS Enabled</h4>
              <p className="text-xs text-gray-600">Works from any origin</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
            <div className="bg-blue-100 p-2 rounded">
              <Code className="h-5 w-5 text-blue-600" />
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
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-blue-600" />
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
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-blue-600" />
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
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-blue-600" />
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
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-blue-600" />
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
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-600" />
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
                  <code className="text-xs text-blue-700 break-all">{getConfigEndpoint}</code>
                </div>
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-xs text-gray-500 mb-1">POST Consent</p>
                  <code className="text-xs text-blue-700 break-all">{postConsentEndpoint}</code>
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
              <li>1. Generate unique visitor token (UUID)</li>
              <li>2. Fetch widget config with cookie categories</li>
              <li>3. Display consent UI with categories</li>
              <li>4. Record consent with selected categories</li>
              <li>5. Check <code className="bg-gray-100 px-1 rounded">isCategoryAllowed()</code> before tracking</li>
              <li>6. Handle consent expiration/renewal</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Important Notes
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>- <strong>necessary</strong> category is always required</li>
              <li>- Check category before enabling any tracking</li>
              <li>- Store consent locally for offline access</li>
              <li>- Use <code className="bg-gray-100 px-1 rounded">partial</code> status for custom selection</li>
              <li>- Visitor token persists across sessions</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
