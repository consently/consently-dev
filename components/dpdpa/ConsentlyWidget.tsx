'use client';

import { useEffect } from 'react';

interface ConsentlyWidgetProps {
  widgetId?: string;
}

function ConsentlyWidget({ widgetId = 'dpdpa_mheon92d_o34gdpk' }: ConsentlyWidgetProps) {
  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[data-dpdpa-widget-id="${widgetId}"]`);
    if (existingScript) {
      console.log('[Consently] Widget script already loaded');
      return;
    }

    // Use local widget script in development, production script otherwise
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname.startsWith('192.168.'));
    
    const scriptSrc = isLocalhost 
      ? '/dpdpa-widget.js'  // Use local widget script
      : 'https://www.consently.in/dpdpa-widget.js';  // Use production script

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.setAttribute('data-dpdpa-widget-id', widgetId);
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

export default ConsentlyWidget;

