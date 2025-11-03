import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    companyName: z.string().min(2, 'Company name is required'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Onboarding Schemas
export const businessInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']),
  country: z.string().min(2, 'Country is required'),
});

export const industrySelectionSchema = z.object({
  industry: z.enum([
    'e-commerce',
    'banking',
    'healthcare',
    'education',
    'real-estate',
    'travel',
    'telecom',
    'other',
  ]),
  subIndustry: z.string().optional(),
});

export const complianceRequirementsSchema = z.object({
  requiresCookieConsent: z.boolean(),
  requiresDPDPAConsent: z.boolean(),
  hasExistingConsents: z.boolean(),
  dataProcessingActivities: z.array(z.string()).min(1, 'Select at least one activity'),
});

export const integrationSetupSchema = z.object({
  websiteUrl: z.string().url('Invalid website URL'),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  technicalContact: z.string().email('Invalid email address').optional(),
});

// Profile Schemas
export const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  companyName: z.string().min(2, 'Company name is required'),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Cookie Scan Schema
export const cookieScanSchema = z.object({
  url: z.string().url('Invalid URL'),
  scanDepth: z.enum(['shallow', 'medium', 'deep']),
});

// Data Category with Retention Period Schema
export const dataCategoryWithRetentionSchema = z.object({
  categoryName: z.string().min(1, 'Category name is required'),
  retentionPeriod: z.string().min(1, 'Retention period is required'),
});

// Activity Purpose Schema (nested structure)
export const activityPurposeSchema = z.object({
  purposeId: z.string().uuid('Invalid purpose ID'),
  legalBasis: z.enum(['consent', 'contract', 'legal-obligation', 'legitimate-interest']),
  customDescription: z.string().optional(),
  dataCategories: z.array(dataCategoryWithRetentionSchema)
    .min(1, 'At least one data category is required for each purpose'),
});

// Processing Activity Schema - New structured format
export const processingActivityStructuredSchema = z.object({
  activityName: z.string()
    .min(3, 'Activity name must be at least 3 characters')
    .max(200, 'Activity name must not exceed 200 characters'),
  industry: z.enum(['e-commerce', 'banking', 'healthcare', 'education', 'real-estate', 'travel', 'telecom', 'other']),
  purposes: z.array(activityPurposeSchema)
    .min(1, 'Select at least one purpose with data categories'),
  dataSources: z.array(z.string()).min(1, 'At least one data source is required'),
  dataRecipients: z.array(z.string()).optional(),
});

// Processing Activity Schema - Form Input (DEPRECATED - for backward compatibility)
export const processingActivityFormSchema = z.object({
  name: z.string().min(3, 'Activity name is required'),
  purposes: z.object({
    selectedPurposes: z.array(z.string()).min(1, 'Select at least one purpose'),
    customDescription: z.string().optional(),
  }),
  industry: z.enum(['e-commerce', 'banking', 'healthcare', 'education', 'real-estate', 'travel', 'telecom', 'other']),
  legalBasis: z.enum(['consent', 'contract', 'legal-obligation', 'legitimate-interest']),
  dataCategories: z.array(z.string()).min(1, 'Data categories are required'),
  retentionPeriod: z.string().min(1, 'Retention period is required'),
  dataSources: z.array(z.string()).min(1, 'Data sources are required'),
  dataRecipients: z.array(z.string()).optional(),
});

// Processing Activity Schema - Default export (use new structured schema)
export const processingActivitySchema = processingActivityStructuredSchema;

// Team Member Schema
export const teamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
});

// Banner Configuration Schema
export const bannerConfigSchema = z.object({
  name: z.string().min(1, 'Banner name is required'),
  position: z.enum(['top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'center-modal']),
  layout: z.enum(['bar', 'box', 'modal', 'popup', 'inline', 'floating']),
  is_active: z.boolean().default(true),
});

// Compliance Check Schema
export const complianceCheckRequestSchema = z.object({
  regulations: z.array(z.enum(['gdpr', 'dpdpa', 'ccpa', 'lgpd', 'pipeda', 'all'])).default(['gdpr']),
  include_cookies: z.boolean().default(true),
  include_consents: z.boolean().default(true),
  include_data_mapping: z.boolean().default(true),
});

// Translation Schema
export const translationSchema = z.object({
  language_code: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
  language_name: z.string().min(1),
  is_rtl: z.boolean().default(false),
  translations: z.record(z.string(), z.any()),
});

// Analytics Query Schema
export const analyticsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  category: z.string().optional(),
});

// Export Types
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;
export type IndustrySelectionInput = z.infer<typeof industrySelectionSchema>;
export type ComplianceRequirementsInput = z.infer<typeof complianceRequirementsSchema>;
export type IntegrationSetupInput = z.infer<typeof integrationSetupSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CookieScanInput = z.infer<typeof cookieScanSchema>;
export type ProcessingActivityInput = z.infer<typeof processingActivitySchema>;
export type ProcessingActivityStructuredInput = z.infer<typeof processingActivityStructuredSchema>;
export type ProcessingActivityFormInput = z.infer<typeof processingActivityFormSchema>;
export type ActivityPurposeInput = z.infer<typeof activityPurposeSchema>;
export type DataCategoryWithRetentionInput = z.infer<typeof dataCategoryWithRetentionSchema>;
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type BannerConfigInput = z.infer<typeof bannerConfigSchema>;
export type ComplianceCheckInput = z.infer<typeof complianceCheckRequestSchema>;
export type TranslationInput = z.infer<typeof translationSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
