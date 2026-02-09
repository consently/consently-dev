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

  // ===== OPTIONAL: DigiLocker Age Verification =====
  DIGILOCKER_ENV: z.enum(['production', 'sandbox']).default('sandbox'),
  DIGILOCKER_CLIENT_ID: z.string().optional(),
  DIGILOCKER_CLIENT_SECRET: z.string().optional(),
  DIGILOCKER_REDIRECT_URI: z.string().url().optional(),
  DIGILOCKER_ISSUER_ID: z.string().optional(), // e.g., 'in.consently'
  DIGILOCKER_SCOPE: z.string().optional(), // e.g., 'openid profile' or 'openid'
  DIGILOCKER_ACR: z.string().optional(), // NSSO canonical value, e.g., 'digilocker'
});

// Type for the environment variables
export type Env = z.infer<typeof envSchema>;

// Cache for validated environment
let validatedEnv: Env | null = null;
let validationError: Error | null = null;

/**
 * Parse and validate environment variables
 * This will throw an error if validation fails
 * Results are cached after first call
 */
function validateEnv(): Env {
  // Return cached result if available
  if (validatedEnv) return validatedEnv;
  if (validationError) throw validationError;

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
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
        validationError = new Error('Environment validation failed. Cannot start application.');
        throw validationError;
      }
      
      // In development, log but continue (allow hot reload to work)
      console.warn('\n⚠️  Continuing in development mode with invalid env vars.\n');
      console.warn('⚠️  Some features may not work correctly.\n');
    }
    validationError = error as Error;
    throw validationError;
  }
}

/**
 * Safe getter for environment variables
 * Returns undefined if validation fails (in development)
 * Throws error in production
 */
function getEnvValue<K extends keyof Env>(key: K): Env[K] | undefined {
  try {
    const env = validateEnv();
    return env[key];
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    // In development, return from process.env directly as fallback
    return process.env[key] as Env[K] | undefined;
  }
}

/**
 * Validated and type-safe environment variables
 * Uses Proxy for lazy validation
 */
export const env = new Proxy({} as Env, {
  get(target, prop: string) {
    return getEnvValue(prop as keyof Env);
  },
});

/**
 * Check if running in production
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = process.env.NODE_ENV === 'test';

/**
 * Helper: Check if a feature is enabled based on env vars
 * Uses direct process.env access to avoid validation issues
 */
export const features = {
  redis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
  sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  analytics: !!process.env.NEXT_PUBLIC_GA_ID,
  payments: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  email: !!process.env.RESEND_API_KEY,
  translation: !!process.env.GOOGLE_TRANSLATE_API_KEY,
  cookieScanner: !!process.env.BROWSERLESS_API_KEY,
  digilocker: !!(process.env.DIGILOCKER_CLIENT_ID && process.env.DIGILOCKER_CLIENT_SECRET && process.env.DIGILOCKER_REDIRECT_URI),
} as const;

/**
 * Log feature availability (useful for debugging)
 */
export function logFeatureStatus() {
  if (isDevelopment && typeof window === 'undefined') {
    console.log('\n📊 Feature Status:');
    console.log(`  Redis: ${features.redis ? '✅' : '❌ (fallback to in-memory)'}`);
    console.log(`  Sentry: ${features.sentry ? '✅' : '❌'}`);
    console.log(`  Analytics: ${features.analytics ? '✅' : '❌'}`);
    console.log(`  Payments: ${features.payments ? '✅' : '❌'}`);
    console.log(`  Email: ${features.email ? '✅' : '❌'}`);
    console.log(`  Translation: ${features.translation ? '✅' : '❌'}`);
    console.log(`  Cookie Scanner: ${features.cookieScanner ? '✅' : '❌'}`);
    console.log(`  DigiLocker: ${features.digilocker ? '✅' : '❌'}\n`);
  }
}

// Log feature status on import (only in development server-side)
if (isDevelopment && typeof window === 'undefined') {
  // Delay to avoid issues during module initialization
  setTimeout(logFeatureStatus, 100);
}
