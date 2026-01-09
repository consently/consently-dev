'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginInput } from '@/lib/schemas';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Check for OAuth error messages from callback
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error === 'oauth_failed' && message) {
      toast.error(`OAuth login failed: ${message}`);
      // Clean up URL
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router]);

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setLoginError(null); // Clear any previous errors

    try {
      // Note: persistSession is handled automatically by Supabase
      // rememberMe would need to be implemented via cookies if needed
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Determine user-friendly error message
        let errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        
        // Check for specific error types from Supabase
        if (error.message) {
          const lowerMessage = error.message.toLowerCase();
          if (lowerMessage.includes('invalid login credentials') || 
              lowerMessage.includes('invalid') ||
              lowerMessage.includes('email not confirmed') ||
              lowerMessage.includes('incorrect')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (lowerMessage.includes('email')) {
            errorMessage = 'Invalid email address. Please check and try again.';
          } else if (lowerMessage.includes('password')) {
            errorMessage = 'Invalid password. Please check and try again.';
          } else if (lowerMessage.includes('too many')) {
            errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
          } else {
            // Use the actual error message if it's user-friendly
            errorMessage = error.message;
          }
        }

        // Set error state for inline display
        setLoginError(errorMessage);
        
        // Also show toast notification
        toast.error(errorMessage, {
          duration: 5000,
          description: 'Please verify your email and password are correct.',
        });
        
        setIsLoading(false);
        return;
      }

      if (authData?.user) {
        // Clear any previous errors
        setLoginError(null);
        
        // Check onboarding status
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', authData.user.id)
          .single();

        toast.success('Welcome back!');
        
        // Redirect to onboarding if not completed
        if (!profile?.onboarding_completed) {
          router.push('/dashboard/setup/onboarding');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setLoginError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
        description: 'If this persists, please contact support.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'twitter' | 'apple') => {
    setIsLoading(true);

    try {
      // Get the current origin (handles both localhost and production)
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        toast.error(`Failed to sign in with ${provider}: ${error.message}`);
        setIsLoading(false);
        return;
      }

      // OAuth redirect will happen automatically, so we don't need to do anything else
      // The loading state will be reset when the page redirects
    } catch (error: unknown) {
      console.error('OAuth exception:', error);
      const errorMessage = error instanceof Error ? error.message : `Failed to sign in with ${provider}. Please try again.`;
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <Shield className="h-10 w-10 text-blue-600" />
          <span className="text-3xl font-bold text-gray-900">Consently</span>
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Display login error if present */}
            {loginError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-red-800">{loginError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoginError(null)}
                    className="ml-auto flex-shrink-0 text-red-600 hover:text-red-800"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <Input
              {...register('email')}
              type="email"
              label="Email Address"
              placeholder="you@company.com"
              error={errors.email?.message}
              disabled={isLoading}
              required
            />

            <PasswordInput
              {...register('password')}
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              disabled={isLoading}
              required
            />

            <div className="flex items-center justify-end text-sm">
              <Link
                href="/reset-password"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up for free
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
