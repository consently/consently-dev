'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, children, title, description, size = 'md' }: ModalProps) {
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
                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
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
