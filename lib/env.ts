/**
 * Environment Variable Validation
 * 
 * This module provides type-safe access to environment variables
 * and validates that all required variables are present at runtime.
 * 
 * Benefits:
 * - Type safety: Autocomplete and type checking for env vars
 * - Runtime validation: Fails fast if required vars are missing
 * - Single source of truth: All env vars defined in one place
 * - Documentation: Clear what's required vs optional
 * 
 * Usage:
 * import { env } from '@/lib/env';
 * console.log(env.NEXT_PUBLIC_SUPABASE_URL);
 */

import { z } from 'zod';

/**
 * Define the schema for environment variables
 * Add new variables here as needed
 */
const envSchema = z.object({
  // ===== REQUIRED: Supabase =====
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL'
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, {
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required and must be at least 20 characters'
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, {
    message: 'SUPABASE_SERVICE_ROLE_KEY is required for server-side operations'
  }),

  // ===== REQUIRED: Application =====
  NEXT_PUBLIC_SITE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SITE_URL must be a valid URL (e.g., https://www.consently.in)'
  }),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ===== OPTIONAL: Analytics & Monitoring =====
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // ===== OPTIONAL: Redis (for rate limiting & caching) =====
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ===== OPTIONAL: Payment =====
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // ===== OPTIONAL: Email =====
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // ===== OPTIONAL: Translation =====
  GOOGLE_TRANSLATE_API_KEY: z.string().optional(),

  // ===== OPTIONAL: Cookie Scanner =====
  BROWSERLESS_API_KEY: z.string().optional(),

  // ===== OPTIONAL: Build & Deployment =====
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  ANALYZE: z.enum(['true', 'false']).optional(),

  // ===== OPTIONAL: CORS Configuration =====
  ALLOWED_ORIGINS: z.string().optional(), // Comma-separated list of allowed origins
});

/**
 * Parse and validate environment variables
 * This will throw an error if validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.ZodIssue) => {
        const field = err.path.join('.');
        const message = err.message;
        return `  ❌ ${field}: ${message}`;
      }).join('\n');

      console.error('\n🚨 ENVIRONMENT VARIABLE VALIDATION FAILED 🚨\n');
      console.error('The following environment variables are missing or invalid:\n');
      console.error(missingVars);
      console.error('\n📝 Please check your .env.local file and ensure all required variables are set.');
      console.error('📖 See .env.example for reference.\n');
      
      // In production, we want to fail hard
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Environment validation failed. Cannot start application.');
      }
      
      // In development, log but continue (allow hot reload to work)
      console.warn('\n⚠️  Continuing in development mode with invalid env vars.\n');
      console.warn('⚠️  Some features may not work correctly.\n');
    }
    throw error;
  }
}

/**
 * Validated and type-safe environment variables
 * Use this instead of process.env throughout your app
 */
export const env = validateEnv();

/**
 * Type for the environment variables
 * Useful for mocking in tests
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Helper: Check if a feature is enabled based on env vars
 */
export const features = {
  redis: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  sentry: !!env.NEXT_PUBLIC_SENTRY_DSN,
  analytics: !!env.NEXT_PUBLIC_GA_ID,
  payments: !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
  email: !!env.RESEND_API_KEY,
  translation: !!env.GOOGLE_TRANSLATE_API_KEY,
  cookieScanner: !!env.BROWSERLESS_API_KEY,
} as const;

/**
 * Log feature availability (useful for debugging)
 */
export function logFeatureStatus() {
  if (isDevelopment) {
    console.log('\n📊 Feature Status:');
    console.log(`  Redis: ${features.redis ? '✅' : '❌ (fallback to in-memory)'}`);
    console.log(`  Sentry: ${features.sentry ? '✅' : '❌'}`);
    console.log(`  Analytics: ${features.analytics ? '✅' : '❌'}`);
    console.log(`  Payments: ${features.payments ? '✅' : '❌'}`);
    console.log(`  Email: ${features.email ? '✅' : '❌'}`);
    console.log(`  Translation: ${features.translation ? '✅' : '❌'}`);
    console.log(`  Cookie Scanner: ${features.cookieScanner ? '✅' : '❌'}\n`);
  }
}

// Log feature status on import (only in development)
if (isDevelopment && typeof window === 'undefined') {
  logFeatureStatus();
}
