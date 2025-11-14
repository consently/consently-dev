'use client';

import { useEffect } from 'react';

interface ConsentlyCookieWidgetProps {
  widgetId?: string;
}

function ConsentlyCookieWidget({ widgetId = 'cnsty_mhnhhg68_map2kra3v' }: ConsentlyCookieWidgetProps) {
  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[data-consently-id="${widgetId}"]`);
    if (existingScript) {
      console.log('[Consently Cookie] Widget script already loaded');
      return;
    }

    const script = document.createElement('script');
    // Use relative path for local development, absolute URL for production
    // The widget.js script will detect the correct API base URL automatically
    const widgetUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/widget.js`
      : '/widget.js';
    script.src = widgetUrl;
    script.setAttribute('data-consently-id', widgetId);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Safely remove script if it exists
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [widgetId]);

  return null;
}

export default ConsentlyCookieWidget;

