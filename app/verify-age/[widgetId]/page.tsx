'use client';

import { useEffect, useState, use } from 'react';

/**
 * /verify-age/[widgetId]
 *
 * Popup page that initiates DigiLocker age verification.
 * Opened by the DPDPA widget in a popup window.
 *
 * Flow:
 * 1. On mount → POST /api/verify-age/init with widgetId
 * 2. On success → redirect to DigiLocker auth URL within this popup
 * 3. DigiLocker redirects back to /api/verify-age/callback which posts result via postMessage
 */

type PageState = 'loading' | 'redirecting' | 'error';

export default function VerifyAgePage({
  params,
}: {
  params: Promise<{ widgetId: string }>;
}) {
  const { widgetId } = use(params);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  async function startVerification() {
    setPageState('loading');
    setErrorMessage('');

    try {
      const apiBase = window.location.origin;
      const response = await fetch(`${apiBase}/api/verify-age/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${response.status})`);
      }

      const { authUrl } = await response.json();

      if (!authUrl) {
        throw new Error('No authorization URL returned');
      }

      setPageState('redirecting');

      // Short delay so user sees the redirecting state
      setTimeout(() => {
        window.location.href = authUrl;
      }, 500);
    } catch (err) {
      console.error('[verify-age] Init error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start verification');
      setPageState('error');
    }
  }

  useEffect(() => {
    startVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Consently branding */}
        <div style={styles.brand}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#4c8bf5" strokeWidth="2" />
            <path d="M9 12L11 14L15 10" stroke="#4c8bf5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={styles.brandText}>Consently</span>
        </div>

        {pageState === 'loading' && (
          <>
            <div style={styles.spinner} />
            <h2 style={styles.heading}>Connecting to DigiLocker...</h2>
            <p style={styles.subtext}>
              Please wait while we set up age verification.
            </p>
          </>
        )}

        {pageState === 'redirecting' && (
          <>
            <div style={styles.spinner} />
            <h2 style={styles.heading}>Redirecting to DigiLocker...</h2>
            <p style={styles.subtext}>
              You will be redirected to DigiLocker to verify your age.
            </p>
          </>
        )}

        {pageState === 'error' && (
          <>
            <div style={styles.errorIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2" />
                <path d="M12 8V12" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="#dc2626" />
              </svg>
            </div>
            <h2 style={styles.heading}>Verification Failed</h2>
            <p style={styles.errorText}>{errorMessage}</p>
            <div style={styles.buttonGroup}>
              <button style={styles.retryButton} onClick={startVerification}>
                Try Again
              </button>
              <button
                style={styles.closeButton}
                onClick={() => window.close()}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: 16,
  },
  card: {
    background: '#ffffff',
    borderRadius: 16,
    padding: '40px 32px',
    maxWidth: 400,
    width: '100%',
    textAlign: 'center' as const,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandText: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1e293b',
  },
  spinner: {
    width: 48,
    height: 48,
    border: '3px solid #e2e8f0',
    borderTopColor: '#4c8bf5',
    borderRadius: '50%',
    animation: 'consently-spin 0.8s linear infinite',
    margin: '0 auto 20px',
  },
  heading: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 8px',
  },
  subtext: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    margin: '0 0 20px',
    lineHeight: 1.5,
  },
  buttonGroup: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  retryButton: {
    padding: '10px 24px',
    background: '#4c8bf5',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  closeButton: {
    padding: '10px 24px',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
