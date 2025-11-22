'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Shield, Check, Loader2, Link2, Smartphone, Clock, ArrowRight } from 'lucide-react';

interface EmailLinkCardProps {
  visitorId: string;
  widgetId: string;
  onVerified?: () => void;
}

export function EmailLinkCard({ visitorId, widgetId, onVerified }: EmailLinkCardProps) {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [countdown, setCountdown] = useState(0);

  // Start countdown timer
  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/privacy-centre/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          visitorId,
          widgetId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Too many requests. Please try again later.', {
            description: 'You can request a new code in 1 hour',
          });
        } else {
          toast.error(data.error || 'Failed to send OTP');
        }
        return;
      }

      setExpiresAt(data.expiresAt);
      setStep('verify');
      setRemainingAttempts(3);
      startCountdown();

      toast.success('OTP sent!', {
        description: `Check your email at ${email}`,
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      toast.error('Please enter the OTP code');
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      toast.error('OTP must be 6 digits');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/privacy-centre/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otpCode,
          visitorId,
          widgetId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'INVALID_OTP') {
          setRemainingAttempts(data.remainingAttempts || 0);

          if (data.maxAttemptsExceeded) {
            toast.error('Maximum attempts exceeded', {
              description: 'Please request a new OTP code',
            });
            setStep('input');
            setOtpCode('');
          } else {
            toast.error('Invalid OTP code', {
              description: `${data.remainingAttempts} attempt(s) remaining`,
            });
          }
        } else if (data.code === 'OTP_NOT_FOUND') {
          toast.error('OTP expired or not found', {
            description: 'Please request a new code',
          });
          setStep('input');
          setOtpCode('');
        } else {
          toast.error(data.error || 'Failed to verify OTP');
        }
        return;
      }

      toast.success('Email verified!', {
        description: `Your preferences are now linked across ${data.linkedDevices} device(s)`,
        duration: 5000,
      });

      // Reset form
      setStep('input');
      setEmail('');
      setOtpCode('');
      setExpiresAt(null);

      // Notify parent component
      onVerified?.();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpCode('');
    await handleSendOTP();
  };

  const handleChangeEmail = () => {
    setStep('input');
    setOtpCode('');
    setExpiresAt(null);
    setCountdown(0);
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 overflow-hidden ring-1 ring-black/5">
      <CardHeader className="pb-4 md:pb-6 border-b border-blue-100/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
            <Link2 className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Link Your Preferences
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-gray-600 leading-relaxed">
              Sync your consent choices across all your devices by verifying your email
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 md:p-6 space-y-6">
        {step === 'input' ? (
          // Step 1: Email Input
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 rounded-lg bg-blue-100 items-center justify-center flex-shrink-0 mt-0.5">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Why Link?</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your preferences will automatically sync across all devices when you use this email.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                    disabled={loading}
                    className="pl-12 pr-4 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white shadow-sm transition-all"
                  />
                </div>
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={loading || !email}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all h-12 text-base font-semibold rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure & Encrypted</span>
            </div>
          </div>
        ) : (
          // Step 2: OTP Verification
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 rounded-full bg-green-100 items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Code Sent To</p>
                  <p className="text-sm font-semibold text-gray-900">{email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChangeEmail}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
              >
                Change
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Enter 6-Digit Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  disabled={loading}
                  className="text-center text-3xl font-mono tracking-[0.5em] h-16 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white shadow-sm transition-all"
                />
                {remainingAttempts < 3 && (
                  <p className="text-sm text-orange-600 font-medium animate-pulse">
                    ⚠️ {remainingAttempts} attempt(s) remaining
                  </p>
                )}
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otpCode.length !== 6}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transition-all h-12 text-base font-semibold rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Verify & Link
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleResendOTP}
                disabled={loading || countdown > 0}
                className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {countdown > 0 ? (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Resend code in {countdown}s
                  </span>
                ) : (
                  'Resend Code'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

