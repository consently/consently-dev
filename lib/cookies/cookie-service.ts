/**
 * Cookie Management Service
 * Production-level cookie tracking, classification, and management
 */

import { createClient } from '@/lib/supabase/server';

export interface Cookie {
  id?: string;
  user_id: string;
  name: string;
  domain: string;
  category: 'necessary' | 'functional' | 'analytics' | 'advertising' | 'social' | 'preferences';
  purpose: string;
  description?: string;
  provider?: string;
  provider_url?: string;
  expiry: string;
  expiry_days?: number;
  type?: 'http' | 'javascript' | 'pixel' | 'server';
  is_third_party?: boolean;
  data_collected?: string[];
  legal_basis?: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  dpo_contact?: string;
  is_active?: boolean;
  last_scanned_at?: Date;
}

export interface CookieCategory {
  id?: string;
  user_id: string;
  category_id: string;
  name: string;
  description: string;
  is_required?: boolean;
  display_order?: number;
  icon?: string;
  color?: string;
  is_active?: boolean;
}

export interface ConsentLog {
  id?: string;
  user_id: string;
  consent_id: string;
  visitor_token: string;
  consent_type: 'cookie' | 'dpdpa' | 'gdpr';
  status: 'accepted' | 'rejected' | 'partial' | 'revoked' | 'updated';
  categories?: string[];
  cookies_accepted?: string[];
  cookies_rejected?: string[];
  device_info?: Record<string, any>;
  geo_location?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  page_url?: string;
  language?: string;
  browser_fingerprint?: string;
  consent_method?: 'banner' | 'settings_modal' | 'api' | 'implicit';
  widget_version?: string;
  tcf_string?: string;
}

export interface ScanResult {
  scan_id: string;
  website_url: string;
  scan_status: 'pending' | 'running' | 'completed' | 'failed';
  scan_depth: 'shallow' | 'medium' | 'deep';
  pages_scanned: number;
  cookies_found: number;
  new_cookies: number;
  changed_cookies: number;
  removed_cookies: number;
  scan_duration?: number;
  cookies_data: any[];
  classification: Record<string, any>;
  recommendations: any[];
  compliance_score?: number;
}

export class CookieService {
  /**
   * Get all cookies for a user with optional filtering
   */
  static async getCookies(
    userId: string,
    options?: {
      category?: string;
      domain?: string;
      is_active?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ cookies: Cookie[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
      .from('cookies')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.domain) {
      query = query.eq('domain', options.domain);
    }

    if (options?.is_active !== undefined) {
      query = query.eq('is_active', options.is_active);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      cookies: data || [],
      total: count || 0,
    };
  }

  /**
   * Get a single cookie by ID
   */
  static async getCookie(userId: string, cookieId: string): Promise<Cookie | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookies')
      .select('*')
      .eq('id', cookieId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new cookie
   */
  static async createCookie(cookie: Cookie): Promise<Cookie> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookies')
      .insert(cookie)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing cookie
   */
  static async updateCookie(
    userId: string,
    cookieId: string,
    updates: Partial<Cookie>
  ): Promise<Cookie> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookies')
      .update(updates)
      .eq('id', cookieId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a cookie
   */
  static async deleteCookie(userId: string, cookieId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('cookies')
      .delete()
      .eq('id', cookieId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Bulk import cookies from scan results
   */
  static async bulkImportCookies(userId: string, cookies: Cookie[]): Promise<number> {
    const supabase = await createClient();

    // Add user_id to all cookies
    const cookiesWithUser = cookies.map((c) => ({ ...c, user_id: userId }));

    const { data, error } = await supabase
      .from('cookies')
      .upsert(cookiesWithUser, {
        onConflict: 'user_id,name,domain',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  }

  /**
   * Get cookie categories for a user
   */
  static async getCategories(userId: string): Promise<CookieCategory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookie_categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new cookie category
   */
  static async createCategory(category: CookieCategory): Promise<CookieCategory> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookie_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a cookie category
   */
  static async updateCategory(
    userId: string,
    categoryId: string,
    updates: Partial<CookieCategory>
  ): Promise<CookieCategory> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookie_categories')
      .update(updates)
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a cookie category
   */
  static async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('cookie_categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Log a consent action
   */
  static async logConsent(log: ConsentLog): Promise<ConsentLog> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('consent_logs')
      .insert(log)
      .select()
      .single();

    if (error) throw error;

    // Trigger analytics aggregation asynchronously
    const today = new Date().toISOString().split('T')[0];
    supabase.rpc('aggregate_consent_analytics', {
      p_user_id: log.user_id,
      p_date: today,
    }).then(() => {
      console.log('Analytics aggregated for', today);
    }).catch((err) => {
      console.error('Failed to aggregate analytics:', err);
    });

    return data;
  }

  /**
   * Get consent logs with filtering
   */
  static async getConsentLogs(
    userId: string,
    options?: {
      status?: string;
      consent_type?: string;
      visitor_token?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ logs: ConsentLog[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
      .from('consent_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.consent_type) {
      query = query.eq('consent_type', options.consent_type);
    }

    if (options?.visitor_token) {
      query = query.eq('visitor_token', options.visitor_token);
    }

    if (options?.start_date) {
      query = query.gte('created_at', options.start_date);
    }

    if (options?.end_date) {
      query = query.lte('created_at', options.end_date);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0,
    };
  }

  /**
   * Get consent analytics for a date range
   */
  static async getConsentAnalytics(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('consent_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get cookie statistics by category
   */
  static async getCookieStatistics(userId: string): Promise<Record<string, number>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookies')
      .select('category')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    const stats: Record<string, number> = {};
    data?.forEach((cookie) => {
      stats[cookie.category] = (stats[cookie.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get unique domains for user's cookies
   */
  static async getUniqueDomains(userId: string): Promise<string[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cookies')
      .select('domain')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    const domains = [...new Set(data?.map((c) => c.domain) || [])];
    return domains;
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(userId: string): Promise<{
    score: number;
    issues: any[];
    recommendations: any[];
    summary: Record<string, any>;
  }> {
    const supabase = await createClient();

    // Get all cookies
    const { cookies } = await this.getCookies(userId, {});

    // Calculate compliance metrics
    const totalCookies = cookies.length;
    const cookiesWithPurpose = cookies.filter((c) => c.purpose).length;
    const cookiesWithLegalBasis = cookies.filter((c) => c.legal_basis).length;
    const thirdPartyCookies = cookies.filter((c) => c.is_third_party).length;

    // Calculate score (0-100)
    let score = 0;
    const checks = [
      { condition: cookiesWithPurpose === totalCookies, weight: 30, name: 'All cookies have defined purposes' },
      { condition: cookiesWithLegalBasis === totalCookies, weight: 30, name: 'All cookies have legal basis' },
      { condition: thirdPartyCookies / totalCookies < 0.3, weight: 20, name: 'Limited third-party cookies' },
      { condition: cookies.some((c) => c.category === 'necessary'), weight: 20, name: 'Necessary cookies identified' },
    ];

    const issues: any[] = [];
    const recommendations: any[] = [];

    checks.forEach((check) => {
      if (check.condition) {
        score += check.weight;
      } else {
        issues.push({
          severity: 'high',
          message: check.name + ' - Not met',
          recommendation: `Please ensure ${check.name.toLowerCase()}`,
        });
      }
    });

    // Add recommendations
    if (thirdPartyCookies > totalCookies * 0.5) {
      recommendations.push({
        type: 'security',
        message: 'High number of third-party cookies detected',
        action: 'Review and minimize third-party cookie usage',
      });
    }

    return {
      score,
      issues,
      recommendations,
      summary: {
        total_cookies: totalCookies,
        cookies_with_purpose: cookiesWithPurpose,
        cookies_with_legal_basis: cookiesWithLegalBasis,
        third_party_cookies: thirdPartyCookies,
        compliance_percentage: Math.round((score / 100) * 100),
      },
    };
  }
}
