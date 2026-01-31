/**
 * DPDPA Widget Configuration Types
 * Production-ready type definitions for widget configuration and display rules
 */

import { z } from 'zod';

// ============================================================================
// Display Rule Types
// ============================================================================

/**
 * URL match types for display rules
 */
export type UrlMatchType = 'exact' | 'contains' | 'startsWith' | 'regex';

/**
 * Trigger types for display rules
 */
export type TriggerType = 'onPageLoad' | 'onClick' | 'onFormSubmit' | 'onScroll';

/**
 * Notice content override structure
 */
export interface NoticeContent {
  title?: string;
  message?: string;
  html?: string;
}

/**
 * Rule context for consent tracking
 * All fields are required when stored, but optional when received from client
 */
export interface RuleContext {
  ruleId: string;
  ruleName: string;
  urlPattern: string;
  pageUrl: string;
  matchedAt?: string;
}

/**
 * Partial rule context (from client request)
 */
export interface PartialRuleContext {
  ruleId?: string;
  ruleName?: string;
  urlPattern?: string;
  pageUrl?: string;
  matchedAt?: string;
}

/**
 * Display rule structure
 */
export interface DisplayRule {
  id: string;
  rule_name: string;
  url_pattern: string;
  url_match_type: UrlMatchType;
  trigger_type: TriggerType;
  trigger_delay?: number;
  element_selector?: string;
  scroll_threshold?: number; // Optional: scroll percentage (0-100) for onScroll trigger
  activities?: string[]; // Optional: filter activities by UUID
  activity_purposes?: Record<string, string[]>; // Optional: filter purposes per activity { activity_id: [purpose_id_1, purpose_id_2] }
  notice_content?: NoticeContent;
  priority: number;
  is_active: boolean;
  notice_id?: string; // Optional: reference to a notice
}

/**
 * Display rule validation schema (Zod)
 */
export const displayRuleSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'ID must contain only alphanumeric characters, hyphens, and underscores'),
  rule_name: z.string().min(1).max(200),
  url_pattern: z.string().min(1).max(500),
  url_match_type: z.enum(['exact', 'contains', 'startsWith', 'regex']),
  trigger_type: z.enum(['onPageLoad', 'onClick', 'onFormSubmit', 'onScroll']),
  trigger_delay: z.number().int().min(0).max(60000).optional(),
  element_selector: z.string().max(500).optional(),
  scroll_threshold: z.number().int().min(0).max(100).optional(), // Scroll percentage (0-100)
  activities: z.array(z.string().uuid()).optional(),
  activity_purposes: z.record(z.string().uuid(), z.array(z.string().uuid())).optional(), // { activity_id: [purpose_id_1, purpose_id_2] }
  notice_content: z.object({
    title: z.string().max(200).optional(),
    message: z.string().max(2000).optional(),
    html: z.string().max(50000).optional(),
  }).optional(),
  priority: z.number().int().min(0).max(1000),
  is_active: z.boolean(),
  notice_id: z.string().max(100).optional(),
});

/**
 * Display rules array validation schema
 */
export const displayRulesSchema = z.array(displayRuleSchema).max(50, 'Maximum 50 display rules allowed');

// ============================================================================
// Widget Configuration Types
// ============================================================================

/**
 * Widget theme configuration
 */
export interface WidgetTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontFamily?: string;
  fontSize?: number;
  logoUrl?: string;
  acceptButtonBg?: string;
  acceptButtonText?: string;
  rejectButtonBg?: string;
  rejectButtonText?: string;
  rejectButtonBorder?: string;
  settingsButtonBg?: string;
  settingsButtonText?: string;
}

/**
 * Widget configuration structure
 */
export interface DPDPAWidgetConfig {
  widgetId: string;
  name: string;
  domain: string;

  // Appearance
  position: 'top' | 'bottom' | 'center' | 'bottom-left' | 'bottom-right' | 'modal';
  layout: 'modal' | 'slide-in' | 'banner';
  theme: WidgetTheme;

  // Content
  title: string;
  message: string;
  acceptButtonText: string;
  rejectButtonText: string;
  customizeButtonText: string;

  // Processing activities
  activities: ProcessingActivityPublic[];

  // Mandatory purposes (cannot be deselected by user)
  mandatoryPurposes?: string[]; // Array of purpose IDs that are mandatory

  // Privacy notice
  privacyNoticeHTML: string;

  // Behavior
  autoShow: boolean;
  showAfterDelay: number;
  consentDuration: number;
  respectDNT: boolean;
  requireExplicitConsent: boolean;
  showDataSubjectsRights: boolean;

  // Advanced
  language: string;
  supportedLanguages: string[];
  customTranslations?: Record<string, Record<string, string>>;
  showBranding: boolean;
  customCSS?: string;

  // Smart Email Pre-fill Settings
  enableSmartPreFill: boolean;
  emailFieldSelectors: string;

  // Age Gate Settings (LEGACY - Deprecated, use DigiLocker verification)
  enableAgeGate?: boolean;
  ageGateThreshold?: number; // Minimum age to proceed (default 18)
  ageGateMinorMessage?: string; // Custom message shown to minors

  // DigiLocker Age Verification (DPDPA 2023 Verifiable Parental Consent)
  requireAgeVerification?: boolean; // Enable government-backed age verification
  ageVerificationThreshold?: number; // Minimum age required (13-21, default 18)
  ageVerificationProvider?: 'digilocker' | 'apisetu' | 'custom';
  minorHandling?: 'block' | 'limited_access';
  verificationValidityDays?: number; // How long verification remains valid (1-365)

  // Display rules (NEW in v2.0)
  display_rules: DisplayRule[];

  // Metadata
  version: string;
}

/**
 * Public-facing processing activity structure (for widget)
 */
export interface ProcessingActivityPublic {
  id: string;
  activity_name: string;
  industry: string;
  purposes: ActivityPurposePublic[];
  // Legacy fields for backward compatibility
  purpose?: string;
  data_attributes?: string[];
  retention_period?: string;
}

/**
 * Public-facing activity purpose structure (for widget)
 */
export interface ActivityPurposePublic {
  id: string;
  purposeId: string;
  purposeName: string;
  legalBasis: 'consent' | 'contract' | 'legal-obligation' | 'legitimate-interest';
  customDescription?: string;
  dataCategories: DataCategoryPublic[];
}

/**
 * Public-facing data category structure (for widget)
 */
export interface DataCategoryPublic {
  id: string;
  categoryName: string;
  retentionPeriod: string;
}

// ============================================================================
// Consent Record Types
// ============================================================================

/**
 * Consent record request payload
 */
export interface ConsentRecordRequest {
  widgetId: string;
  visitorId: string; // User-visible Consent ID (Format: CNST-XXXX-XXXX-XXXX)
  consentStatus: 'accepted' | 'rejected' | 'partial' | 'revoked';
  acceptedActivities: string[];
  rejectedActivities: string[];
  activityConsents: Record<string, { status: string; timestamp: string }>;
  // DEPRECATED: activityPurposeConsents - use acceptedPurposeConsents instead
  activityPurposeConsents?: Record<string, string[]>; // { activity_id: [purpose_id_1, purpose_id_2] } - purposes consented to per activity
  // NEW: Separate tracking for accepted and rejected purposes
  acceptedPurposeConsents?: Record<string, string[]>; // { activity_id: [purpose_id_1, purpose_id_2] } - purposes user accepted
  rejectedPurposeConsents?: Record<string, string[]>; // { activity_id: [purpose_id_1, purpose_id_2] } - purposes user rejected
  ruleContext?: PartialRuleContext;
  metadata?: ConsentMetadata;
  consentDuration?: number;
  revocationReason?: string; // Optional reason for revocation
  visitorEmail?: string | null; // Optional: for cross-device consent management (will be hashed)
  consentSource?: ConsentSource; // Source of consent: web_widget, mobile_sdk, api, privacy_centre
}

/**
 * Consent source types - tracks where consent originated from
 */
export type ConsentSource = 'web_widget' | 'mobile_sdk' | 'api' | 'privacy_centre';

/**
 * Consent metadata
 */
export interface ConsentMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown';
  browser?: string;
  os?: string;
  country?: string;
  language?: string;
  referrer?: string;
  currentUrl?: string;
  pageTitle?: string;
}

/**
 * Consent details stored in database
 */
export interface ConsentDetails {
  activityConsents: Record<string, { status: string; timestamp: string }>;
  // DEPRECATED: activityPurposeConsents - use acceptedPurposeConsents instead
  activityPurposeConsents?: Record<string, string[]>; // { activity_id: [purpose_id_1, purpose_id_2] } - purposes consented to per activity
  // NEW: Separate tracking for accepted and rejected purposes
  acceptedPurposeConsents?: Record<string, string[]>; // { activity_id: [purpose_id_1, purpose_id_2] } - purposes user accepted
  rejectedPurposeConsents?: Record<string, string[]>; // { activity_id: [purpose_id_1, purpose_id_2] } - purposes user rejected
  ruleContext: RuleContext | null;
  privacy_notice_snapshot?: string; // NEW: Snapshot of the privacy notice HTML at consent time
  metadata: ConsentMetadata;
}


// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Consent record request validation schema
 */
export const consentRecordRequestSchema = z.object({
  widgetId: z.string().min(1).max(100),
  visitorId: z.string().min(1).max(200), // User-visible Consent ID
  consentStatus: z.enum(['accepted', 'rejected', 'partial', 'revoked']),
  acceptedActivities: z.array(z.string().uuid()),
  rejectedActivities: z.array(z.string().uuid()),
  activityConsents: z.record(z.string(), z.object({
    status: z.string(),
    timestamp: z.string(),
  })), // z.record(keySchema, valueSchema) - keys can be any string (including UUIDs)
  activityPurposeConsents: z.record(z.string(), z.array(z.string().uuid())).optional(), // DEPRECATED: use acceptedPurposeConsents
  acceptedPurposeConsents: z.record(z.string(), z.array(z.string().uuid())).optional(), // NEW: accepted purposes per activity
  rejectedPurposeConsents: z.record(z.string(), z.array(z.string().uuid())).optional(), // NEW: rejected purposes per activity
  ruleContext: z.object({
    ruleId: z.string().optional(),
    ruleName: z.string().optional(),
    urlPattern: z.string().optional(),
    pageUrl: z.string().optional(),
    matchedAt: z.string().optional(),
  }).optional(),
  metadata: z.object({
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    deviceType: z.enum(['Desktop', 'Mobile', 'Tablet', 'Unknown']).optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    country: z.string().optional(),
    language: z.string().optional(),
    referrer: z.string().optional(),
    currentUrl: z.string().optional(), // Removed strict .url() validation to allow edge cases
    pageTitle: z.string().optional(),
  }).optional(),
  consentDuration: z.number().int().min(1).max(3650).optional(),
  revocationReason: z.string().max(500).optional(), // Optional reason for revocation
  visitorEmail: z.string().email().max(255).nullish(), // Optional: for cross-device consent management (will be hashed) - accepts null or undefined
  consentSource: z.enum(['web_widget', 'mobile_sdk', 'api', 'privacy_centre']).optional(), // Source of consent
});

/**
 * Widget configuration update schema
 */
export const widgetConfigUpdateSchema = z.object({
  display_rules: displayRulesSchema.optional(),
  // Add other updatable fields as needed
}).passthrough();

// ============================================================================
// Error Types
// ============================================================================

/**
 * API error response structure
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, any>;
  retryAfter?: number;
}

/**
 * Validation error response structure
 */
export interface ValidationError extends ApiError {
  error: 'Validation failed';
  details: {
    field: string;
    message: string;
    code: string;
  }[];
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Type guard for display rule
 */
export function isDisplayRule(rule: any): rule is DisplayRule {
  return (
    typeof rule === 'object' &&
    rule !== null &&
    typeof rule.id === 'string' &&
    typeof rule.rule_name === 'string' &&
    typeof rule.url_pattern === 'string' &&
    ['exact', 'contains', 'startsWith', 'regex'].includes(rule.url_match_type) &&
    ['onPageLoad', 'onClick', 'onFormSubmit', 'onScroll'].includes(rule.trigger_type) &&
    typeof rule.priority === 'number' &&
    typeof rule.is_active === 'boolean'
  );
}

/**
 * Type guard for display rules array
 */
export function isDisplayRulesArray(rules: any): rules is DisplayRule[] {
  return Array.isArray(rules) && rules.every(isDisplayRule);
}

// ============================================================================
// Utility Functions Type Definitions
// ============================================================================

/**
 * URL pattern matcher function type
 */
export type UrlMatcher = (url: string, pattern: string, matchType: UrlMatchType) => boolean;

/**
 * Rule evaluator function type
 */
export type RuleEvaluator = (rules: DisplayRule[], currentUrl: string) => DisplayRule | null;

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Rule match analytics event
 */
export interface RuleMatchEvent {
  widgetId: string;
  visitorId: string;
  ruleId: string;
  ruleName: string;
  urlPattern: string;
  pageUrl: string;
  matchedAt: string;
  triggerType: TriggerType;
  userAgent?: string;
  deviceType?: string;
  country?: string;
  language?: string;
}

/**
 * Consent analytics event
 */
export interface ConsentEvent {
  widgetId: string;
  visitorId: string;
  ruleId?: string;
  ruleName?: string;
  consentStatus: 'accepted' | 'rejected' | 'partial';
  acceptedActivities: string[];
  rejectedActivities: string[];
  consentedAt: string;
  userAgent?: string;
  deviceType?: string;
  country?: string;
  language?: string;
}

/**
 * Rule performance analytics
 */
export interface RulePerformance {
  ruleId: string;
  ruleName: string;
  matchCount: number;
  consentCount: number;
  acceptanceRate: number;
  rejectionRate: number;
  partialRate: number;
  averageTimeToConsent?: number; // in seconds
}

/**
 * Widget analytics summary
 */
export interface WidgetAnalytics {
  widgetId: string;
  totalMatches: number;
  totalConsents: number;
  overallAcceptanceRate: number;
  rulePerformance: RulePerformance[];
  topRules: RulePerformance[];
  consentTrends: {
    date: string;
    matches: number;
    consents: number;
    acceptanceRate: number;
  }[];
}

// ============================================================================
// Age Verification Types (DigiLocker / API Setu)
// ============================================================================

/**
 * Age verification session status
 */
export type AgeVerificationStatus =
  | 'pending'
  | 'in_progress'
  | 'verified'
  | 'failed'
  | 'expired';

/**
 * Age verification provider types
 */
export type AgeVerificationProvider = 'digilocker' | 'apisetu' | 'custom';

/**
 * Minor handling options
 */
export type MinorHandling = 'block' | 'limited_access';

/**
 * Age verification session (client-facing)
 */
export interface AgeVerificationSession {
  sessionId: string;
  widgetId: string;
  visitorId: string;
  status: AgeVerificationStatus;
  verifiedAge?: number;
  isMinor?: boolean;
  documentType?: string;
  verifiedAt?: string;
  expiresAt: string;
  verificationAssertion?: string; // JWT for client-side proof
}

/**
 * Age verification initiation request
 */
export interface AgeVerificationInitRequest {
  widgetId: string;
  visitorId: string;
  returnUrl: string;
}

/**
 * Age verification initiation response
 */
export interface AgeVerificationInitResponse {
  success: boolean;
  sessionId: string;
  redirectUrl: string;
  expiresAt: string;
  mockMode?: boolean;
  error?: string;
}

/**
 * Age verification status response
 */
export interface AgeVerificationStatusResponse {
  status: AgeVerificationStatus;
  verified: boolean;
  age?: number;
  isMinor?: boolean;
  verificationAssertion?: string;
  documentType?: string;
  verifiedAt?: string;
  message: string;
  error?: string;
}



