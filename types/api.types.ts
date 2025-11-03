// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Cookie Types
export interface Cookie {
  id: string;
  name: string;
  domain: string;
  path: string;
  category: 'necessary' | 'functional' | 'analytics' | 'advertising';
  expiry: string;
  description?: string;
  purpose?: string;
}

export interface CookieScanResult {
  scanId: string;
  url: string;
  scanDate: string;
  cookies: Cookie[];
  totalCookies: number;
  categoryCounts: {
    necessary: number;
    functional: number;
    analytics: number;
    advertising: number;
  };
}

// Consent Record Types
export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'cookie' | 'dpdpa';
  status: 'granted' | 'denied' | 'withdrawn';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  categories?: string[];
  expiryDate?: string;
}

// Processing Activity Types
export interface ProcessingActivity {
  id: string;
  userId: string;
  name: string;
  description: string;
  legalBasis: 'consent' | 'contract' | 'legal-obligation' | 'legitimate-interest';
  dataCategories: string[]; // DEPRECATED: Use purposes with categories
  dataSources: string[];
  dataRecipients?: string[];
  retentionPeriod: string; // DEPRECATED: Use per-category retention
  securityMeasures?: string[];
  crossBorderTransfers: boolean;
  createdAt: string;
  updatedAt: string;
}

// New structured types for processing activities
export interface Purpose {
  id: string;
  purposeName: string;
  description: string | null;
  isPredefined: boolean;
}

export interface DataCategoryWithRetention {
  id: string;
  categoryName: string;
  retentionPeriod: string;
}

export interface ActivityPurpose {
  id: string;
  activityId: string;
  purposeId: string;
  purposeName: string; // Denormalized for convenience
  legalBasis: 'consent' | 'contract' | 'legal-obligation' | 'legitimate-interest';
  customDescription: string | null;
  dataCategories: DataCategoryWithRetention[];
}

export interface ProcessingActivityStructured {
  id: string;
  userId: string;
  activityName: string;
  industry: string;
  purposes: ActivityPurpose[];
  dataSources: string[];
  dataRecipients: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request payload for creating/updating activities
export interface CreateProcessingActivityPayload {
  activityName: string;
  industry: string;
  purposes: {
    purposeId: string;
    legalBasis: 'consent' | 'contract' | 'legal-obligation' | 'legitimate-interest';
    customDescription?: string;
    dataCategories: {
      categoryName: string;
      retentionPeriod: string;
    }[];
  }[];
  dataSources: string[];
  dataRecipients?: string[];
}

// Analytics Types
export interface ConsentMetrics {
  totalConsents: number;
  grantedConsents: number;
  deniedConsents: number;
  withdrawnConsents: number;
  consentRate: number;
  trends: {
    date: string;
    granted: number;
    denied: number;
  }[];
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface GeographicData {
  country: string;
  consents: number;
  consentRate: number;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'small' | 'medium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  consentLimit: number;
  consentUsed: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  phone?: string;
  website?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Team Member Types
export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'active' | 'inactive';
  invitedAt: string;
  joinedAt?: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Banner Template Types
export interface BannerTemplate {
  id: string;
  name: string;
  type: 'modal' | 'banner' | 'corner';
  position: 'top' | 'bottom' | 'center';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  showDeclineButton: boolean;
  showSettingsLink: boolean;
  previewImage?: string;
}

// Export Request Types
export interface ExportRequest {
  format: 'csv' | 'json' | 'pdf';
  dataType: 'consents' | 'activities' | 'audit-logs';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}
