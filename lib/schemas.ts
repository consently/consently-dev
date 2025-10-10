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

// Processing Activity Schema
export const processingActivitySchema = z.object({
  name: z.string().min(3, 'Activity name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  legalBasis: z.enum(['consent', 'contract', 'legal-obligation', 'legitimate-interest']),
  dataCategories: z.array(z.string()).min(1, 'Select at least one data category'),
  retentionPeriod: z.string().min(1, 'Retention period is required'),
  dataSources: z.array(z.string()).min(1, 'Select at least one data source'),
  dataRecipients: z.array(z.string()).optional(),
});

// Team Member Schema
export const teamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
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
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
