'use client';

import { useState, useEffect } from 'react';
import { Textarea } from './textarea';
import { Input } from './input';
import { Button } from './button';
import { Plus, X } from 'lucide-react';

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
  const [customPurposes, setCustomPurposes] = useState<Purpose[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newPurposeText, setNewPurposeText] = useState('');

  // Load custom purposes from selectedPurposes that have custom- prefix
  useEffect(() => {
    const customs = value.selectedPurposes
      .filter(id => id.startsWith('custom-'))
      .map(id => ({
        id,
        label: id.replace('custom-', '').replace(/-/g, ' '),
      }));
    setCustomPurposes(customs);
  }, [value.selectedPurposes]);

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

  const handleAddCustomPurpose = () => {
    if (!newPurposeText.trim()) return;
    
    const purposeId = `custom-${newPurposeText.toLowerCase().replace(/\s+/g, '-')}`;
    const newPurpose: Purpose = {
      id: purposeId,
      label: newPurposeText.trim(),
    };
    
    setCustomPurposes(prev => [...prev, newPurpose]);
    onChange({
      ...value,
      selectedPurposes: [...value.selectedPurposes, purposeId],
    });
    setNewPurposeText('');
    setShowCustomInput(false);
  };

  const handleRemoveCustomPurpose = (purposeId: string) => {
    setCustomPurposes(prev => prev.filter(p => p.id !== purposeId));
    onChange({
      ...value,
      selectedPurposes: value.selectedPurposes.filter(id => id !== purposeId),
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

      {/* Custom Purposes */}
      {customPurposes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 font-medium">Custom purposes:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {customPurposes.map((purpose) => (
              <div
                key={purpose.id}
                className="flex items-start gap-2 p-3 border border-purple-500 bg-purple-50 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={value.selectedPurposes.includes(purpose.id)}
                  onChange={() => handlePurposeToggle(purpose.id)}
                  className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 flex-1">{purpose.label}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomPurpose(purpose.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove custom purpose"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Purpose */}
      {showCustomInput ? (
        <div className="flex gap-2">
          <Input
            value={newPurposeText}
            onChange={(e) => setNewPurposeText(e.target.value)}
            placeholder="Enter custom purpose..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomPurpose();
              } else if (e.key === 'Escape') {
                setShowCustomInput(false);
                setNewPurposeText('');
              }
            }}
            autoFocus
          />
          <Button
            type="button"
            onClick={handleAddCustomPurpose}
            disabled={!newPurposeText.trim()}
            size="sm"
          >
            Add
          </Button>
          <Button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setNewPurposeText('');
            }}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setShowCustomInput(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Purpose
        </Button>
      )}

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
