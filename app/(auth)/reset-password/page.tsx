'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/schemas';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);

    try {
      // Redirect directly to update-password page
      // Supabase will append hash fragments (#access_token=...&type=recovery) to this URL
      // Note: This URL must be whitelisted in Supabase Dashboard > Authentication > URL Configuration
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectUrl = `${baseUrl}/auth/update-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        // Show clear error message
        let errorMessage = 'Unable to send reset email. Please try again.';
        
        if (error.message.includes('400')) {
          errorMessage = 'Invalid email address or account not found. Please check your email and try again.';
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage, {
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      toast.success('Password reset email sent! Check your inbox for instructions.', {
        duration: 5000,
      });
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      toast.error('An unexpected error occurred. Please try again.', {
        duration: 5000,
      });
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

        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!isSuccess ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-600">
                  Enter your email address and we&apos;ll send you instructions to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="you@company.com"
                  error={errors.email?.message}
                  disabled={isLoading}
                  required
                />

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <Link
                  href="/login"
                  className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-6">
                  We&apos;ve sent password reset instructions to your email address. Please check your
                  inbox and follow the link to reset your password.
                </p>
                <Link href="/login">
                  <Button className="w-full">Back to Login</Button>
                </Link>
              </div>
            </>
          )}
        </div>

        {!isSuccess && (
          <p className="mt-6 text-center text-xs text-gray-500">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
