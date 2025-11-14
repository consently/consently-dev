import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logSuccess, logFailure, getIpAddress, getUserAgent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      
      // Log failed login attempt
      await logFailure(
        undefined,
        'user.login',
        'auth',
        error.message,
        request
      );
      
      // Redirect to login with error message
      const url = new URL('/login', request.url);
      url.searchParams.set('error', 'oauth_failed');
      url.searchParams.set('message', error.message);
      return NextResponse.redirect(url);
    }

    if (sessionData?.user) {
      // Use service role client to check/create user profile (bypasses RLS)
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Check onboarding status for new users
      if (!next) {
        // Fetch user profile to check onboarding status
        const { data: profile } = await serviceClient
          .from('users')
          .select('onboarding_completed')
          .eq('id', sessionData.user.id)
          .single();

        // If profile doesn't exist, create it (for OAuth users)
        if (!profile) {
          await serviceClient
            .from('users')
            .insert({
              id: sessionData.user.id,
              email: sessionData.user.email!,
              full_name: sessionData.user.user_metadata?.full_name || null,
              auth_provider: sessionData.user.app_metadata?.provider || 'email',
              onboarding_completed: false,
            })
            .select()
            .single();

          // Log successful registration
          await logSuccess(
            sessionData.user.id,
            'user.register',
            'user',
            sessionData.user.id,
            {
              email: sessionData.user.email,
              provider: sessionData.user.app_metadata?.provider || 'email'
            },
            request
          );

          // Redirect to onboarding for new users
          return NextResponse.redirect(new URL('/dashboard/setup/onboarding', request.url));
        }

        // Redirect to onboarding if not completed
        if (!profile.onboarding_completed) {
          return NextResponse.redirect(new URL('/dashboard/setup/onboarding', request.url));
        }
      }

      // Log successful login
      await logSuccess(
        sessionData.user.id,
        'user.login',
        'auth',
        sessionData.user.id,
        {
          email: sessionData.user.email,
          provider: sessionData.user.app_metadata?.provider || 'email'
        },
        request
      );

      // Use provided next URL or default to dashboard
      return NextResponse.redirect(new URL(next || '/dashboard', request.url));
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
}
