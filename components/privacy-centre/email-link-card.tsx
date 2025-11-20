'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Shield, Check, Loader2, Link2, Smartphone, Clock } from 'lucide-react';

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
    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      <CardHeader className="pb-4 md:pb-5">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 items-center justify-center shadow-lg flex-shrink-0">
            <Link2 className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 bg-clip-text text-transparent mb-2">
              Link Your Preferences
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-gray-700 leading-relaxed">
              Sync your consent choices across all your devices by verifying your email
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 md:space-y-6">
        {step === 'input' ? (
          // Step 1: Email Input
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-purple-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 items-center justify-center flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Why Link?</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your preferences will automatically sync across all devices when you use this email
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                      disabled={loading}
                      className="pl-11 h-12 text-base border-2 border-purple-200 focus:border-purple-400 bg-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={loading || !email}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all h-12 text-base font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                <strong>Privacy Notice:</strong> Your email is encrypted and only used for verification. 
                We'll never share it or send spam.
              </p>
            </div>
          </>
        ) : (
          // Step 2: OTP Verification
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Code Sent!</h3>
                    <p className="text-sm text-gray-600">{email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeEmail}
                  disabled={loading}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  Change
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
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
                    className="text-center text-2xl font-mono tracking-widest h-14 border-2 border-purple-200 focus:border-purple-400 bg-white"
                  />
                  {remainingAttempts < 3 && (
                    <p className="text-sm text-orange-600 font-medium">
                      ⚠️ {remainingAttempts} attempt(s) remaining
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otpCode.length !== 6}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all h-12 text-base font-semibold"
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
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={loading || countdown > 0}
                  className="w-full border-2 border-purple-200 hover:bg-purple-50"
                >
                  {countdown > 0 ? (
                    <>Resend in {countdown}s</>
                  ) : (
                    <>Resend Code</>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs md:text-sm text-amber-800">
                Code expires in <strong>10 minutes</strong>. Check your spam folder if you don't see it.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

