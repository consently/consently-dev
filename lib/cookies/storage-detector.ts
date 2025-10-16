/**
 * Client-Side Storage Detector
 * Detects localStorage, sessionStorage, and IndexedDB usage
 */

export interface ClientStorageItem {
  type: 'localStorage' | 'sessionStorage' | 'indexedDB';
  key: string;
  domain: string;
  size: number;
  category?: string;
  provider?: string;
  purpose?: string;
  sampleValue?: string; // Truncated/redacted for privacy
}

export interface StorageDetectionResult {
  localStorage: ClientStorageItem[];
  sessionStorage: ClientStorageItem[];
  indexedDB: ClientStorageItem[];
  totalCount: number;
  totalSize: number;
}

/**
 * Storage key patterns mapped to providers and purposes
 */
const STORAGE_KEY_PATTERNS = {
  // Google Analytics
  _ga: {
    provider: 'Google Analytics',
    category: 'analytics',
    purpose: 'Analytics tracking data',
  },
  _gid: {
    provider: 'Google Analytics',
    category: 'analytics',
    purpose: 'Analytics session data',
  },
  // Google Tag Manager
  _gtm: {
    provider: 'Google Tag Manager',
    category: 'analytics',
    purpose: 'Tag manager data layer',
  },
  // Facebook
  _fbp: {
    provider: 'Facebook Pixel',
    category: 'advertising',
    purpose: 'Facebook advertising tracking',
  },
  // Amplitude
  amplitude_: {
    provider: 'Amplitude',
    category: 'analytics',
    purpose: 'Product analytics tracking',
  },
  // Mixpanel
  mp_: {
    provider: 'Mixpanel',
    category: 'analytics',
    purpose: 'User behavior analytics',
  },
  // Segment
  ajs_: {
    provider: 'Segment',
    category: 'analytics',
    purpose: 'Analytics integration',
  },
  // Hotjar
  _hjid: {
    provider: 'Hotjar',
    category: 'analytics',
    purpose: 'Heatmap and recording',
  },
  // Auth/Session
  token: {
    provider: 'Internal',
    category: 'necessary',
    purpose: 'Authentication token',
  },
  session: {
    provider: 'Internal',
    category: 'necessary',
    purpose: 'Session management',
  },
  auth: {
    provider: 'Internal',
    category: 'necessary',
    purpose: 'Authentication data',
  },
  // Preferences
  theme: {
    provider: 'Internal',
    category: 'preferences',
    purpose: 'User theme preference',
  },
  lang: {
    provider: 'Internal',
    category: 'preferences',
    purpose: 'Language preference',
  },
  locale: {
    provider: 'Internal',
    category: 'preferences',
    purpose: 'Locale settings',
  },
  // Redux persist
  'persist:': {
    provider: 'Redux Persist',
    category: 'functional',
    purpose: 'Application state persistence',
  },
  // Zustand
  zustand: {
    provider: 'Zustand',
    category: 'functional',
    purpose: 'State management',
  },
};

/**
 * Detect all client-side storage on a page using Playwright
 */
export async function detectClientStorage(page: any): Promise<StorageDetectionResult> {
  const result: StorageDetectionResult = {
    localStorage: [],
    sessionStorage: [],
    indexedDB: [],
    totalCount: 0,
    totalSize: 0,
  };

  try {
    // Detect localStorage and sessionStorage
    const storageData = await page.evaluate(() => {
      const domain = window.location.hostname;
      const localItems: any[] = [];
      const sessionItems: any[] = [];

      // LocalStorage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key) || '';
            localItems.push({
              key,
              size: value.length,
              sampleValue: value.substring(0, 50), // First 50 chars only
              domain,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to read localStorage:', e);
      }

      // SessionStorage
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            const value = sessionStorage.getItem(key) || '';
            sessionItems.push({
              key,
              size: value.length,
              sampleValue: value.substring(0, 50), // First 50 chars only
              domain,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to read sessionStorage:', e);
      }

      return { localItems, sessionItems };
    });

    // Process localStorage items
    for (const item of storageData.localItems) {
      const classified = classifyStorageKey(item.key);
      result.localStorage.push({
        type: 'localStorage',
        key: item.key,
        domain: item.domain,
        size: item.size,
        sampleValue: item.sampleValue,
        ...classified,
      });
      result.totalSize += item.size;
    }

    // Process sessionStorage items
    for (const item of storageData.sessionItems) {
      const classified = classifyStorageKey(item.key);
      result.sessionStorage.push({
        type: 'sessionStorage',
        key: item.key,
        domain: item.domain,
        size: item.size,
        sampleValue: item.sampleValue,
        ...classified,
      });
      result.totalSize += item.size;
    }

    // Detect IndexedDB
    const indexedDBData = await page.evaluate(async () => {
      const databases: any[] = [];
      
      try {
        // Get all database names (modern browsers)
        if (indexedDB.databases) {
          const dbs = await indexedDB.databases();
          for (const db of dbs) {
            if (db.name) {
              databases.push({
                key: db.name,
                size: db.version || 0,
                domain: window.location.hostname,
              });
            }
          }
        } else {
          // Fallback: Try to open known common DB names
          const commonDBNames = [
            'firebaseLocalStorageDb',
            'workbox-precache',
            'keyval-store',
            'localforage',
            'pouchdb',
          ];
          
          for (const dbName of commonDBNames) {
            try {
              const request = indexedDB.open(dbName);
              await new Promise((resolve) => {
                request.onsuccess = () => {
                  databases.push({
                    key: dbName,
                    size: 0,
                    domain: window.location.hostname,
                  });
                  request.result.close();
                  resolve(true);
                };
                request.onerror = () => resolve(false);
                setTimeout(() => resolve(false), 1000);
              });
            } catch (e) {
              // DB doesn't exist, continue
            }
          }
        }
      } catch (e) {
        console.warn('Failed to enumerate IndexedDB:', e);
      }

      return databases;
    });

    // Process IndexedDB items
    for (const item of indexedDBData) {
      const classified = classifyStorageKey(item.key);
      result.indexedDB.push({
        type: 'indexedDB',
        key: item.key,
        domain: item.domain,
        size: item.size,
        ...classified,
      });
    }

    result.totalCount = 
      result.localStorage.length + 
      result.sessionStorage.length + 
      result.indexedDB.length;

    console.log(
      `Detected ${result.totalCount} storage items ` +
      `(${result.localStorage.length} localStorage, ` +
      `${result.sessionStorage.length} sessionStorage, ` +
      `${result.indexedDB.length} IndexedDB)`
    );

    return result;
    
  } catch (error) {
    console.error('Failed to detect client storage:', error);
    return result;
  }
}

/**
 * Classify a storage key based on known patterns
 */
function classifyStorageKey(key: string): {
  provider?: string;
  category?: string;
  purpose?: string;
} {
  const lowerKey = key.toLowerCase();

  // Check exact matches first
  for (const [pattern, info] of Object.entries(STORAGE_KEY_PATTERNS)) {
    if (lowerKey === pattern.toLowerCase() || lowerKey.startsWith(pattern.toLowerCase())) {
      return {
        provider: info.provider,
        category: info.category,
        purpose: info.purpose,
      };
    }
  }

  // Heuristic classification
  if (lowerKey.includes('token') || lowerKey.includes('auth') || lowerKey.includes('session')) {
    return {
      provider: 'Internal',
      category: 'necessary',
      purpose: 'Authentication or session management',
    };
  }

  if (lowerKey.includes('analytics') || lowerKey.includes('tracking') || lowerKey.includes('metric')) {
    return {
      provider: 'Unknown',
      category: 'analytics',
      purpose: 'Analytics or tracking data',
    };
  }

  if (lowerKey.includes('ad') || lowerKey.includes('marketing') || lowerKey.includes('campaign')) {
    return {
      provider: 'Unknown',
      category: 'advertising',
      purpose: 'Advertising or marketing data',
    };
  }

  if (lowerKey.includes('pref') || lowerKey.includes('setting') || lowerKey.includes('config')) {
    return {
      provider: 'Internal',
      category: 'preferences',
      purpose: 'User preferences or settings',
    };
  }

  // Default
  return {
    provider: 'Unknown',
    category: 'functional',
    purpose: 'Application data',
  };
}

/**
 * Convert storage items to cookie-like format for unified reporting
 */
export function storageItemsToCookieFormat(items: ClientStorageItem[]): any[] {
  return items.map(item => ({
    name: item.key,
    domain: item.domain,
    category: item.category || 'functional',
    provider: item.provider || 'Unknown',
    purpose: item.purpose || 'Client-side storage',
    description: `${item.type} storage: ${item.purpose || 'Application data'}`,
    expiry: item.type === 'sessionStorage' ? 'Session' : 'Persistent',
    type: item.type,
    is_third_party: item.provider !== 'Internal',
    size_bytes: item.size,
    storage_type: item.type,
  }));
}

/**
 * Generate storage summary for reporting
 */
export function generateStorageSummary(result: StorageDetectionResult): {
  totalItems: number;
  totalSize: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  largestItems: ClientStorageItem[];
} {
  const byType: Record<string, number> = {
    localStorage: result.localStorage.length,
    sessionStorage: result.sessionStorage.length,
    indexedDB: result.indexedDB.length,
  };

  const byCategory: Record<string, number> = {};
  const allItems = [
    ...result.localStorage,
    ...result.sessionStorage,
    ...result.indexedDB,
  ];

  for (const item of allItems) {
    const category = item.category || 'unknown';
    byCategory[category] = (byCategory[category] || 0) + 1;
  }

  // Find largest items by size
  const largestItems = [...allItems]
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  return {
    totalItems: result.totalCount,
    totalSize: result.totalSize,
    byType,
    byCategory,
    largestItems,
  };
}
