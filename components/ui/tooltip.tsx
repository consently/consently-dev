'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

export interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative inline-flex items-center group">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || <Info className="h-4 w-4 text-gray-400 hover:text-blue-600 transition-colors" />}
      </div>
      
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2",
            "px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg",
            "max-w-xs w-max animate-in fade-in-0 zoom-in-95",
            className
          )}
          role="tooltip"
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
