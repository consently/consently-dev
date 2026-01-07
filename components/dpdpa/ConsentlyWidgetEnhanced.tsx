'use client';

import { useEffect, useState } from 'react';

interface ConsentlyWidgetProps {
  widgetId?: string;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  timeout?: number;
}

interface WidgetState {
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  retryCount: number;
}

function ConsentlyWidgetEnhanced({ 
  widgetId = 'dpdpa_mheon92d_o34gdpk',
  fallback,
  onError,
  timeout = 10000
}: ConsentlyWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>({
    loading: true,
    loaded: false,
    error: null,
    retryCount: 0
  });

  const MAX_RETRIES = 3;
  const WIDGET_CDN_URLS = [
    'https://cdn.consently.in/dpdpa-widget.js',
    'https://www.consently.in/dpdpa-widget.js',
    '/dpdpa-widget.js' // Local fallback
  ];

  const loadWidget = async (retryIndex = 0) => {
    try {
      setWidgetState(prev => ({ ...prev, loading: true, error: null }));

      // Check if script is already loaded
      if (window.ConsentlyWidget && window.ConsentlyWidget.version) {
        setWidgetState(prev => ({ ...prev, loading: false, loaded: true }));
        return;
      }

      const scriptSrc = WIDGET_CDN_URLS[retryIndex];
      
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptSrc;
        script.async = true;
        script.setAttribute('data-dpdpa-widget-id', widgetId);
        
        // Set up timeout
        const timeoutId = setTimeout(() => {
          reject(new Error(`Widget loading timeout after ${timeout}ms`));
        }, timeout);

        script.onload = () => {
          clearTimeout(timeoutId);
          // Verify the widget loaded successfully
          if (window.ConsentlyWidget) {
            resolve();
          } else {
            reject(new Error('Widget script loaded but initialization failed'));
          }
        };

        script.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to load widget from ${scriptSrc}`));
        };

        document.body.appendChild(script);
      });

      setWidgetState(prev => ({ ...prev, loading: false, loaded: true }));
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      // Retry logic
      if (retryIndex < WIDGET_CDN_URLS.length - 1) {
        console.warn(`[Consently] Retrying with fallback URL (${retryIndex + 1}/${WIDGET_CDN_URLS.length})`);
        setTimeout(() => loadWidget(retryIndex + 1), 1000);
      } else if (widgetState.retryCount < MAX_RETRIES) {
        console.warn(`[Consently] Retrying in 5 seconds... (Attempt ${widgetState.retryCount + 1}/${MAX_RETRIES})`);
        setWidgetState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
        setTimeout(() => loadWidget(0), 5000);
      } else {
        setWidgetState(prev => ({ ...prev, loading: false, error: err }));
        onError?.(err);
      }
    }
  };

  useEffect(() => {
    loadWidget();
  }, [widgetId]);

  // Add TypeScript declaration for the widget
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).ConsentlyWidget = (window as any).ConsentlyWidget || {};
    }
  }, []);

  if (widgetState.loading) {
    return fallback || (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading consent manager...</span>
      </div>
    );
  }

  if (widgetState.error) {
    return fallback || (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600 mb-2">
          Unable to load consent manager. Please refresh the page or try again later.
        </p>
        <button 
          onClick={() => loadWidget()}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
}

export default ConsentlyWidgetEnhanced;

// Add global type declarations
declare global {
  interface Window {
    ConsentlyWidget?: {
      version?: string;
      [key: string]: any;
    };
  }
}
