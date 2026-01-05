'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Sparkles, ArrowRight, X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface TrialBannerProps {
  className?: string;
}

export function TrialBanner({ className = '' }: TrialBannerProps) {
  const [trialData, setTrialData] = useState<{
    isTrial: boolean;
    daysLeft: number;
    trialEnd: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrialStatus();
    
    // Check if user has dismissed the banner for this session
    const isDismissed = sessionStorage.getItem('trialBannerDismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const fetchTrialStatus = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscription?.is_trial && subscription.trial_end) {
        const trialEnd = new Date(subscription.trial_end);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft > 0) {
          setTrialData({
            isTrial: true,
            daysLeft,
            trialEnd: subscription.trial_end,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('trialBannerDismissed', 'true');
  };

  if (loading || !trialData || dismissed) {
    return null;
  }

  const urgencyLevel = trialData.daysLeft <= 7 ? 'urgent' : trialData.daysLeft <= 14 ? 'warning' : 'normal';

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative overflow-hidden rounded-lg p-4 ${
          urgencyLevel === 'urgent'
            ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200'
            : urgencyLevel === 'warning'
            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200'
            : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200'
        }`}
      >
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>

        {/* Icon */}
        <div className="flex items-start mb-2">
          <div
            className={`p-2 rounded-lg ${
              urgencyLevel === 'urgent'
                ? 'bg-red-100'
                : urgencyLevel === 'warning'
                ? 'bg-yellow-100'
                : 'bg-blue-100'
            }`}
          >
            {urgencyLevel === 'urgent' ? (
              <Clock className="h-4 w-4 text-red-600" />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-600" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {urgencyLevel === 'urgent' ? '⚡ Trial Ending Soon!' : '🎉 Free Trial Active'}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-bold text-lg">
                {trialData.daysLeft}
              </span>{' '}
              {trialData.daysLeft === 1 ? 'day' : 'days'} left
            </p>
          </div>

          {/* Features */}
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>Unlimited consents</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>Deep cookie scanning</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-600">✓</span>
              <span>Full DPDPA compliance</span>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/dashboard"
            className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg transition-all ${
              urgencyLevel === 'urgent'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : urgencyLevel === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <span>{urgencyLevel === 'urgent' ? 'Upgrade Now' : 'Go to Dashboard'}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Background decoration */}
        <div className="absolute -bottom-2 -right-2 opacity-10">
          <Sparkles className="h-16 w-16" />
        </div>
      </div>
    </div>
  );
}

