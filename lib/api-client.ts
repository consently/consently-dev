/**
 * API Client utilities for making authenticated API requests
 */

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: HeadersInit;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  try {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'include',
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed:`, error);
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * API Client Methods
 */
export const api = {
  // Consent Records
  consent: {
    getRecords: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      type?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/consent/records?${queryParams.toString()}`);
    },
    deleteRecord: (recordId: string) =>
      apiRequest('/api/consent/records', {
        method: 'DELETE',
        body: { recordId },
      }),
    recordConsent: (data: any) =>
      apiRequest('/api/consent/record', {
        method: 'POST',
        body: data,
      }),
  },

  // Dashboard Analytics
  analytics: {
    getDashboard: (days?: number) =>
      apiRequest(`/api/analytics/dashboard${days ? `?days=${days}` : ''}`),
  },

  // Reports
  reports: {
    getAnalytics: (params?: { dateRange?: string; format?: string }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/reports/analytics?${queryParams.toString()}`);
    },
  },

  // Processing Activities
  activities: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      industry?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/dpdpa/activities?${queryParams.toString()}`);
    },
    create: (data: any) =>
      apiRequest('/api/dpdpa/activities', {
        method: 'POST',
        body: data,
      }),
    update: (id: string, data: any) =>
      apiRequest('/api/dpdpa/activities', {
        method: 'PUT',
        body: { id, ...data },
      }),
    delete: (id: string) =>
      apiRequest(`/api/dpdpa/activities?id=${id}`, {
        method: 'DELETE',
      }),
  },

  // User Profile
  profile: {
    get: () => apiRequest('/api/user/profile'),
    update: (data: { full_name?: string; avatar_url?: string }) =>
      apiRequest('/api/user/profile', {
        method: 'PUT',
        body: data,
      }),
    updateEmail: (email: string) =>
      apiRequest('/api/user/profile', {
        method: 'PATCH',
        body: { action: 'update-email', email },
      }),
    updatePassword: (password: string) =>
      apiRequest('/api/user/profile', {
        method: 'PATCH',
        body: { action: 'update-password', password },
      }),
    delete: () =>
      apiRequest('/api/user/profile', {
        method: 'DELETE',
      }),
  },

  // Onboarding
  onboarding: {
    complete: (data: any) =>
      apiRequest('/api/onboarding', {
        method: 'POST',
        body: data,
      }),
  },

  // Cookies
  cookies: {
    // Cookie Management
    scan: (url: string) =>
      apiRequest('/api/cookies/scan', {
        method: 'POST',
        body: { url },
      }),
    getAll: (params?: { category?: string; domain?: string; is_active?: boolean; limit?: number; offset?: number }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/cookies/manage?${queryParams.toString()}`);
    },
    create: (data: any) =>
      apiRequest('/api/cookies/manage', {
        method: 'POST',
        body: data,
      }),
    update: (data: any) =>
      apiRequest('/api/cookies/manage', {
        method: 'PUT',
        body: data,
      }),
    delete: (id: string) =>
      apiRequest(`/api/cookies/manage?id=${id}`, {
        method: 'DELETE',
      }),
    
    // Banner Configuration
    getBanners: (params?: { id?: string; active?: boolean; versions?: boolean }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/cookies/banner?${queryParams.toString()}`);
    },
    createBanner: (data: any) =>
      apiRequest('/api/cookies/banner', {
        method: 'POST',
        body: data,
      }),
    updateBanner: (data: any) =>
      apiRequest('/api/cookies/banner', {
        method: 'PUT',
        body: data,
      }),
    deleteBanner: (id: string) =>
      apiRequest(`/api/cookies/banner?id=${id}`, {
        method: 'DELETE',
      }),
    
    // Analytics
    getAnalytics: (params?: { start_date?: string; end_date?: string; granularity?: string; category?: string; export?: string }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/cookies/analytics?${queryParams.toString()}`);
    },
    generateCustomReport: (data: any) =>
      apiRequest('/api/cookies/analytics', {
        method: 'POST',
        body: data,
      }),
    
    // Compliance
    getCompliance: (params?: { id?: string; history?: boolean; regulation?: string }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/cookies/compliance?${queryParams.toString()}`);
    },
    runComplianceCheck: (data: any) =>
      apiRequest('/api/cookies/compliance', {
        method: 'POST',
        body: data,
      }),
    scheduleCompliance: (data: any) =>
      apiRequest('/api/cookies/compliance', {
        method: 'PUT',
        body: data,
      }),
    deleteComplianceSchedule: (schedule_id: string) =>
      apiRequest(`/api/cookies/compliance?schedule_id=${schedule_id}`, {
        method: 'DELETE',
      }),
    
    // Translations
    getTranslations: (params?: { language?: string; active?: boolean; export?: string }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/cookies/translations?${queryParams.toString()}`);
    },
    createTranslation: (data: any) =>
      apiRequest('/api/cookies/translations', {
        method: 'POST',
        body: data,
      }),
    updateTranslation: (data: any) =>
      apiRequest('/api/cookies/translations', {
        method: 'PUT',
        body: data,
      }),
    deleteTranslation: (params: { id?: string; language?: string }) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
      return apiRequest(`/api/cookies/translations?${queryParams.toString()}`, {
        method: 'DELETE',
      });
    },
    
    // Legacy endpoints
    getBannerConfig: () => apiRequest('/api/cookies/banner-config'),
    saveBannerConfig: (data: any) =>
      apiRequest('/api/cookies/banner-config', {
        method: 'POST',
        body: data,
      }),
    getWidgetConfig: () => apiRequest('/api/cookies/widget-config'),
    saveWidgetConfig: (data: any) =>
      apiRequest('/api/cookies/widget-config', {
        method: 'POST',
        body: data,
      }),
  },

  // Payments
  payments: {
    createSubscription: (plan: string) =>
      apiRequest('/api/payments/create-subscription', {
        method: 'POST',
        body: { plan },
      }),
    verifyPayment: (data: {
      orderId: string;
      paymentId: string;
      signature: string;
    }) =>
      apiRequest('/api/payments/verify-payment', {
        method: 'POST',
        body: data,
      }),
  },

  // Emails
  emails: {
    send: (data: { templateName: string; recipientEmail: string; variables: any }) =>
      apiRequest('/api/emails/send', {
        method: 'POST',
        body: data,
      }),
    getTemplates: () => apiRequest('/api/emails/templates'),
    getLogs: (params?: { page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/emails/logs?${queryParams.toString()}`);
    },
  },

  // Audit Logs
  audit: {
    getLogs: (params?: {
      page?: number;
      limit?: number;
      action?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      return apiRequest(`/api/audit/logs?${queryParams.toString()}`);
    },
    export: (format: 'csv' | 'json', params?: any) => {
      const queryParams = new URLSearchParams({ format, ...params });
      return apiRequest(`/api/audit/export?${queryParams.toString()}`);
    },
  },
};

/**
 * React Hook for API calls with loading and error states
 */
export function useApiQuery<T = any>(
  fetcher: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetcher();
        
        if (mounted) {
          if (response.error) {
            setError(response.error);
          } else {
            setData(response.data || null);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, error, loading };
}

// Export React if needed
import React from 'react';
