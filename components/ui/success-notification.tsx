'use client';

import { useEffect } from 'react';
import { CheckCircle2, Sparkles, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessNotificationProps {
  title?: string;
  message?: string;
  showIcon?: boolean;
  variant?: 'default' | 'preferences' | 'consent';
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  className?: string;
}

export function SuccessNotification({
  title = 'Success!',
  message = 'Your changes have been saved successfully.',
  showIcon = true,
  variant = 'default',
  onClose,
  autoClose = true,
  duration = 4000,
  className,
}: SuccessNotificationProps) {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const variantStyles = {
    default: {
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      border: 'border-green-200',
      bg: 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-50',
      icon: <CheckCircle2 className="h-6 w-6 text-white" />,
    },
    preferences: {
      iconBg: 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600',
      border: 'border-blue-200',
      bg: 'bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50',
      icon: <Shield className="h-6 w-6 text-white" />,
    },
    consent: {
      iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      border: 'border-indigo-200',
      bg: 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50',
      icon: <Sparkles className="h-6 w-6 text-white" />,
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 shadow-xl backdrop-blur-sm',
        styles.border,
        styles.bg,
        className
      )}
      style={{
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative flex items-start gap-4 p-5 md:p-6">
        {showIcon && (
          <div className={cn(
            'flex h-12 w-12 md:h-14 md:w-14 flex-shrink-0 items-center justify-center rounded-xl shadow-lg',
            styles.iconBg
          )}>
            {styles.icon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1.5 flex items-center gap-2">
            {title}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3" />
              Saved
            </span>
          </h3>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            {message}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white/50"
            aria-label="Close notification"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar for auto-close */}
      {autoClose && onClose && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 animate-progress"
            style={{
              animation: `progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

    </div>
  );
}

