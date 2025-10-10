'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Building2, 
  Globe, 
  Shield, 
  Palette, 
  CheckCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const INDUSTRIES = [
  'E-commerce',
  'Healthcare',
  'Financial Services',
  'Education',
  'Technology/SaaS',
  'Media & Entertainment',
  'Travel & Hospitality',
  'Real Estate',
  'Government',
  'Other'
];

const CONSENT_CATEGORIES = [
  { id: 'necessary', name: 'Necessary', required: true },
  { id: 'analytics', name: 'Analytics', required: false },
  { id: 'marketing', name: 'Marketing', required: false },
  { id: 'preferences', name: 'Preferences', required: false }
];

const BANNER_STYLES = [
  { id: 'minimal', name: 'Minimalist', description: 'Simple banner at bottom' },
  { id: 'detailed', name: 'Detailed', description: 'Full info with categories' },
  { id: 'floating', name: 'Floating Modal', description: 'Center modal overlay' }
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' }
];

type StepData = {
  industry: string;
  websiteUrl: string;
  companyName: string;
  language: string;
  categories: string[];
  bannerStyle: string;
  primaryColor: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StepData>({
    industry: '',
    websiteUrl: '',
    companyName: '',
    language: 'en',
    categories: ['necessary'],
    bannerStyle: 'minimal',
    primaryColor: '#3b82f6'
  });

  const totalSteps = 4;

  const updateFormData = (updates: Partial<StepData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save onboarding data to backend
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save onboarding data');

      // Redirect to dashboard
      router.push('/dashboard?onboarding=complete');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.industry && formData.companyName;
      case 2:
        return formData.websiteUrl;
      case 3:
        return formData.categories.length > 0;
      case 4:
        return formData.bannerStyle;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome to Consently! 🎉
          </h1>
          <p className="text-gray-600">
            Let's set up your consent management in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-1 items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>Business Info</span>
            <span>Website</span>
            <span>Consent</span>
            <span>Customize</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {/* Step 1: Business Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <Building2 className="h-8 w-8" />
                <h2 className="text-2xl font-semibold">Business Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your company name"
                    value={formData.companyName}
                    onChange={(e) => updateFormData({ companyName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Industry *
                  </label>
                  <Select
                    value={formData.industry}
                    onChange={(e) => updateFormData({ industry: e.target.value })}
                  >
                    <option value="">Select your industry</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Preferred Language
                  </label>
                  <Select
                    value={formData.language}
                    onChange={(e) => updateFormData({ language: e.target.value })}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Website Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <Globe className="h-8 w-8" />
                <h2 className="text-2xl font-semibold">Website Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Website URL *
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={(e) => updateFormData({ websiteUrl: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This is where you'll embed the consent widget
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <h3 className="mb-2 font-medium text-blue-900">
                    What happens next?
                  </h3>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• We'll generate a custom consent widget for your site</li>
                    <li>• You'll get an embed code to add to your website</li>
                    <li>• All consents will be tracked in your dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Consent Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <Shield className="h-8 w-8" />
                <h2 className="text-2xl font-semibold">Consent Categories</h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Select which consent categories you want to offer to your visitors
                </p>

                {CONSENT_CATEGORIES.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-4"
                  >
                    <Checkbox
                      id={category.id}
                      checked={formData.categories.includes(category.id)}
                      disabled={category.required}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateFormData({
                          categories: checked
                            ? [...formData.categories, category.id]
                            : formData.categories.filter((c) => c !== category.id)
                        });
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={category.id}
                        className="block font-medium text-gray-900"
                      >
                        {category.name}
                        {category.required && (
                          <span className="ml-2 text-xs text-blue-600">
                            (Required)
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Customize Banner */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <Palette className="h-8 w-8" />
                <h2 className="text-2xl font-semibold">Customize Your Banner</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Banner Style
                  </label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {BANNER_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => updateFormData({ bannerStyle: style.id })}
                        className={`rounded-lg border-2 p-4 text-left transition-all ${
                          formData.bannerStyle === style.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{style.name}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {style.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => updateFormData({ primaryColor: e.target.value })}
                      className="h-12 w-20"
                    />
                    <Input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => updateFormData({ primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <h3 className="mb-2 font-medium text-green-900">
                    🎉 You're all set!
                  </h3>
                  <p className="text-sm text-green-700">
                    Click "Complete Setup" to finish onboarding and access your
                    dashboard. You can customize everything later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!isStepValid() || loading}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
