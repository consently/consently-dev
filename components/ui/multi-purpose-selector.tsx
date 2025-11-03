'use client';

import { useState, useEffect } from 'react';
import { Textarea } from './textarea';

interface Purpose {
  id: string;
  label: string;
}

interface MultiPurposeSelectorProps {
  value: {
    selectedPurposes: string[];
    customDescription: string;
  };
  onChange: (value: { selectedPurposes: string[]; customDescription: string }) => void;
  predefinedPurposes: Purpose[];
  label?: string;
  error?: string;
  required?: boolean;
}

export function MultiPurposeSelector({
  value = { selectedPurposes: [], customDescription: '' },
  onChange,
  predefinedPurposes,
  label,
  error,
  required,
}: MultiPurposeSelectorProps) {
  const handlePurposeToggle = (purposeId: string) => {
    const isSelected = value.selectedPurposes.includes(purposeId);
    const newSelectedPurposes = isSelected
      ? value.selectedPurposes.filter((id) => id !== purposeId)
      : [...value.selectedPurposes, purposeId];

    onChange({
      ...value,
      selectedPurposes: newSelectedPurposes,
    });
  };

  const handleCustomDescriptionChange = (description: string) => {
    onChange({
      ...value,
      customDescription: description,
    });
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Predefined Purposes Checkboxes */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600 font-medium">Select purposes:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {predefinedPurposes.map((purpose) => (
            <label
              key={purpose.id}
              className={`flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                value.selectedPurposes.includes(purpose.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={value.selectedPurposes.includes(purpose.id)}
                onChange={() => handlePurposeToggle(purpose.id)}
                className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 flex-1">{purpose.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Description */}
      <div>
        <Textarea
          value={value.customDescription}
          onChange={(e) => handleCustomDescriptionChange(e.target.value)}
          label="Additional Details (Optional)"
          placeholder="Add any specific details or purposes not covered above..."
          rows={4}
          helperText="Provide additional context about the purpose and scope of this activity"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Common predefined purposes for different industries
export const COMMON_PURPOSES: Record<string, Purpose[]> = {
  'e-commerce': [
    { id: 'order-tracking', label: 'Enable Order Tracking' },
    { id: 'personalize-experience', label: 'Personalize User Experience' },
    { id: 'billing-payments', label: 'Manage Billing & Payments' },
    { id: 'marketing-communications', label: 'Send Marketing Communications' },
    { id: 'customer-support', label: 'Provide Customer Support' },
    { id: 'fraud-prevention', label: 'Prevent Fraud & Ensure Security' },
  ],
  banking: [
    { id: 'account-management', label: 'Account Management & Transactions' },
    { id: 'kyc-verification', label: 'KYC & Identity Verification' },
    { id: 'credit-assessment', label: 'Credit Assessment & Loan Processing' },
    { id: 'fraud-prevention', label: 'Fraud Detection & Prevention' },
    { id: 'regulatory-compliance', label: 'Regulatory Compliance' },
    { id: 'customer-communications', label: 'Customer Communications & Alerts' },
  ],
  healthcare: [
    { id: 'patient-care', label: 'Provide Patient Care & Treatment' },
    { id: 'medical-records', label: 'Maintain Medical Records' },
    { id: 'appointment-scheduling', label: 'Schedule Appointments & Reminders' },
    { id: 'billing-insurance', label: 'Billing & Insurance Claims' },
    { id: 'prescription-management', label: 'Prescription Management' },
    { id: 'telemedicine', label: 'Telemedicine Services' },
  ],
  education: [
    { id: 'enrollment', label: 'Student Enrollment & Registration' },
    { id: 'academic-records', label: 'Maintain Academic Records' },
    { id: 'online-learning', label: 'Deliver Online Learning Content' },
    { id: 'fee-management', label: 'Fee Management & Billing' },
    { id: 'parent-communication', label: 'Parent-Teacher Communication' },
    { id: 'performance-tracking', label: 'Track Student Performance' },
  ],
  'real-estate': [
    { id: 'property-listing', label: 'Property Listing & Management' },
    { id: 'lead-management', label: 'Lead Management & Follow-up' },
    { id: 'property-viewing', label: 'Schedule Property Viewings' },
    { id: 'tenant-screening', label: 'Tenant Screening & Verification' },
    { id: 'lease-management', label: 'Lease Agreement Management' },
    { id: 'maintenance-requests', label: 'Handle Maintenance Requests' },
  ],
  travel: [
    { id: 'booking-reservations', label: 'Booking & Reservations' },
    { id: 'check-in', label: 'Guest Check-in & Verification' },
    { id: 'loyalty-program', label: 'Loyalty Program Management' },
    { id: 'personalized-offers', label: 'Personalized Travel Offers' },
    { id: 'guest-feedback', label: 'Collect Guest Feedback' },
    { id: 'travel-coordination', label: 'Travel Coordination & Support' },
  ],
  telecom: [
    { id: 'customer-activation', label: 'Customer Activation & Onboarding' },
    { id: 'service-provisioning', label: 'Service Provisioning' },
    { id: 'billing', label: 'Billing & Payment Processing' },
    { id: 'network-management', label: 'Network Quality Management' },
    { id: 'customer-support', label: 'Customer Service & Support' },
    { id: 'usage-tracking', label: 'Usage Tracking & Analytics' },
  ],
  other: [
    { id: 'account-management', label: 'Account Management' },
    { id: 'service-delivery', label: 'Service Delivery' },
    { id: 'customer-support', label: 'Customer Support' },
    { id: 'marketing', label: 'Marketing & Communications' },
    { id: 'analytics', label: 'Analytics & Improvement' },
    { id: 'security', label: 'Security & Fraud Prevention' },
  ],
};
