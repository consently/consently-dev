export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          auth_provider: 'email' | 'google' | 'twitter' | 'apple';
          subscription_plan: 'small' | 'medium' | 'enterprise' | null;
          subscription_status: 'active' | 'inactive' | 'cancelled' | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          auth_provider: 'email' | 'google' | 'twitter' | 'apple';
          subscription_plan?: 'small' | 'medium' | 'enterprise' | null;
          subscription_status?: 'active' | 'inactive' | 'cancelled' | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          auth_provider?: 'email' | 'google' | 'twitter' | 'apple';
          subscription_plan?: 'small' | 'medium' | 'enterprise' | null;
          subscription_status?: 'active' | 'inactive' | 'cancelled' | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      consent_records: {
        Row: {
          id: string;
          user_id: string;
          consent_id: string;
          visitor_email: string;
          tokenized_email: string;
          consent_type: 'cookie' | 'dpdpa';
          status: 'accepted' | 'rejected' | 'partial' | 'revoked';
          categories: Json;
          device_type: 'Desktop' | 'Mobile' | 'Tablet';
          ip_address: string | null;
          user_agent: string | null;
          language: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          consent_id: string;
          visitor_email: string;
          tokenized_email: string;
          consent_type: 'cookie' | 'dpdpa';
          status: 'accepted' | 'rejected' | 'partial' | 'revoked';
          categories: Json;
          device_type: 'Desktop' | 'Mobile' | 'Tablet';
          ip_address?: string | null;
          user_agent?: string | null;
          language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          consent_id?: string;
          visitor_email?: string;
          tokenized_email?: string;
          consent_type?: 'cookie' | 'dpdpa';
          status?: 'accepted' | 'rejected' | 'partial' | 'revoked';
          categories?: Json;
          device_type?: 'Desktop' | 'Mobile' | 'Tablet';
          ip_address?: string | null;
          user_agent?: string | null;
          language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cookie_scans: {
        Row: {
          id: string;
          user_id: string;
          website_url: string;
          scan_date: string;
          cookies_found: Json;
          classification: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          website_url: string;
          scan_date?: string;
          cookies_found: Json;
          classification: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          website_url?: string;
          scan_date?: string;
          cookies_found?: Json;
          classification?: Json;
          created_at?: string;
        };
      };
      processing_activities: {
        Row: {
          id: string;
          user_id: string;
          activity_name: string;
          industry: string;
          data_attributes: string[];
          purpose: string;
          retention_period: string;
          data_processors: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_name: string;
          industry: string;
          data_attributes: string[];
          purpose: string;
          retention_period: string;
          data_processors: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_name?: string;
          industry?: string;
          data_attributes?: string[];
          purpose?: string;
          retention_period?: string;
          data_processors?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'small' | 'medium' | 'enterprise';
          status: 'active' | 'inactive' | 'cancelled';
          amount: number;
          currency: string;
          billing_cycle: 'monthly' | 'yearly';
          payment_provider: 'razorpay' | 'stripe';
          payment_id: string | null;
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: 'small' | 'medium' | 'enterprise';
          status?: 'active' | 'inactive' | 'cancelled';
          amount: number;
          currency?: string;
          billing_cycle?: 'monthly' | 'yearly';
          payment_provider?: 'razorpay' | 'stripe';
          payment_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: 'small' | 'medium' | 'enterprise';
          status?: 'active' | 'inactive' | 'cancelled';
          amount?: number;
          currency?: string;
          billing_cycle?: 'monthly' | 'yearly';
          payment_provider?: 'razorpay' | 'stripe';
          payment_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
