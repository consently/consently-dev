'use client';

import { useEffect } from 'react';

function ConsentlyWidget() {
  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[data-dpdpa-widget-id="dpdpa_mheon92d_o34gdpk"]');
    if (existingScript) {
      console.log('[Consently] Widget script already loaded');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.consently.in/dpdpa-widget.js';
    script.setAttribute('data-dpdpa-widget-id', 'dpdpa_mheon92d_o34gdpk');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Safely remove script if it exists
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}

export default ConsentlyWidget;

