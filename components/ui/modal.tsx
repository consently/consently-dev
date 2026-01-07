'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useSafeAreaInsets } from '@/lib/hooks/useMediaQuery';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mobileSheet?: boolean; // Enable bottom sheet on mobile
}

export function Modal({ open, onClose, children, title, description, size = 'md', mobileSheet = true }: ModalProps) {
  const isMobile = useIsMobile();
  const safeAreaInsets = useSafeAreaInsets();
  
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Mobile bottom sheet or desktop modal
  if (isMobile && mobileSheet) {
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Bottom Sheet */}
        <div
          className={cn(
            'relative bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] overflow-hidden transform transition-transform duration-300 ease-out',
            open ? 'translate-y-0' : 'translate-y-full'
          )}
          style={{
            paddingBottom: `${Math.max(16, safeAreaInsets.bottom)}px`,
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          {(title || description) && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-11 h-11 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all touch-manipulation"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-120px)]">{children}</div>
        </div>
      </div>
    );
  }

  // Desktop modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white rounded-xl shadow-xl w-full mx-4 max-h-[90vh] overflow-hidden',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
                {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-11 h-11 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all touch-manipulation"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-100px)]">{children}</div>
      </div>
    </div>
  );
}
