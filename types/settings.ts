/**
 * Types for Settings Page
 */

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface AuthInfo {
  email: string;
  emailVerified: boolean;
  lastSignIn: string | null;
}

export interface UserProfileData {
  profile: UserProfile;
  subscription: Subscription | null;
  auth: AuthInfo;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  consent_granted: boolean;
  consent_withdrawn: boolean;
  weekly_report: boolean;
  security_alerts: boolean;
  product_updates: boolean;
  marketing_emails: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingHistory {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoice_url: string | null;
  billing_date: string;
  created_at: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  avatar_url?: string;
  company_name?: string;
  phone?: string;
  website?: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateNotificationPreferencesInput {
  consent_granted?: boolean;
  consent_withdrawn?: boolean;
  weekly_report?: boolean;
  security_alerts?: boolean;
  product_updates?: boolean;
  marketing_emails?: boolean;
}

export type SettingsTab = 'profile' | 'security' | 'notifications';
