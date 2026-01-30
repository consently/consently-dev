/**
 * DigiLocker Verification Notice Component
 *
 * Displays an informational notice to users BEFORE redirecting to DigiLocker
 * for age verification. Explains that PAN/KYC screens are expected and normal.
 *
 * Use this component on any page that initiates DigiLocker age verification.
 */

import React from 'react';
import { Info } from 'lucide-react';

interface DigiLockerVerificationNoticeProps {
  /**
   * Variant controls the styling
   * - 'info': Blue info box (default)
   * - 'warning': Amber warning box (for emphasis)
   */
  variant?: 'info' | 'warning';

  /**
   * Compact mode shows shorter text
   */
  compact?: boolean;

  /**
   * Custom className for additional styling
   */
  className?: string;
}

export default function DigiLockerVerificationNotice({
  variant = 'warning',
  compact = false,
  className = '',
}: DigiLockerVerificationNoticeProps) {
  const isWarning = variant === 'warning';

  const baseClasses = isWarning
    ? 'bg-amber-50 border-l-4 border-amber-400'
    : 'bg-blue-50 border-l-4 border-blue-400';

  const iconColor = isWarning ? 'text-amber-400' : 'text-blue-400';
  const textColor = isWarning ? 'text-amber-700' : 'text-blue-700';

  return (
    <div className={`${baseClasses} p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Info className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          {compact ? (
            <p className={`text-sm ${textColor}`}>
              <strong>DigiLocker Verification Required</strong><br/>
              You'll be redirected to India's official DigiLocker service.
              DigiLocker may ask for PAN or Aadhaar details for verification - this is expected and required by government policy.
            </p>
          ) : (
            <>
              <h3 className={`text-sm font-medium ${textColor}`}>
                Age Verification via DigiLocker
              </h3>
              <div className={`mt-2 text-sm ${textColor}`}>
                <p>
                  You'll be redirected to <strong>DigiLocker</strong> (India's official digital documents service)
                  to verify your age securely.
                </p>
                <div className="mt-3 space-y-2">
                  <p>
                    <strong>What to expect:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      DigiLocker may ask for <strong>PAN or Aadhaar details</strong> to complete verification
                    </li>
                    <li>
                      This is a <strong>one-time process</strong> required by government policy for age verification
                    </li>
                    <li>
                      Your date of birth is <strong>never stored</strong> - only your verified age
                    </li>
                    <li>
                      After verification, future age checks will be seamless
                    </li>
                  </ul>
                </div>
                <p className="mt-3 text-xs">
                  <em>
                    Note: Screens asking for PAN/profile details are part of DigiLocker's identity
                    assurance process and are NOT an error. This strengthens your DigiLocker account
                    for future verifications.
                  </em>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact variant for use in modals or tight spaces
 */
export function DigiLockerVerificationNoticeCompact(props: Omit<DigiLockerVerificationNoticeProps, 'compact'>) {
  return <DigiLockerVerificationNotice {...props} compact={true} />;
}
