import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client with ANONYMOUS KEY for authenticated operations.
 * 
 * Use this for:
 * - Dashboard pages (requires user authentication)
 * - Protected API routes (admin/user operations)
 * - Operations that should respect RLS policies
 * 
 * RLS: Row Level Security policies WILL be enforced
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client with SERVICE ROLE KEY that bypasses RLS.
 * 
 * ⚠️ IMPORTANT: Use this ONLY for public endpoints that need to allow
 * anonymous visitors to perform operations without authentication.
 * 
 * Use this for:
 * - Public privacy-centre APIs (consent preferences, OTP verification)
 * - Public widget APIs (cookie consent, DPDPA widget)
 * - Public form submissions (contact, careers)
 * - Operations where visitors don't have accounts
 * 
 * RLS: Row Level Security policies WILL BE BYPASSED
 * 
 * Security: Always validate inputs and scope operations properly
 * (e.g., by visitor_id, widget_id) even though RLS is bypassed.
 */
export async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore cookie setting errors in server components
          }
        },
      },
    }
  );
}
