'use client';

import { useState } from 'react';
import { X, Check, Download, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Purpose {
  id: string;
  purposeId: string;
  purposeName: string;
  legalBasis: string;
  customDescription?: string;
  dataCategories: Array<{
    id: string;
    categoryName: string;
    retentionPeriod: string;
  }>;
}

interface ProcessingActivity {
  id: string;
  activity_name: string;
  industry: string;
  // New structure with multiple purposes
  purposes?: Purpose[];
  // Legacy fields for backward compatibility
  purpose?: string;
  data_attributes?: string[];
  retention_period?: string;
}

interface ConsentNoticeTemplateProps {
  activities: ProcessingActivity[];
  config: {
    logo?: string;
    companyName: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    language: string;
    supportedLanguages: string[];
    privacyNoticeUrl?: string;
    showLanguageSelector?: boolean;
  };
  translations: {
    noticeTitle: string;
    noticeDescription: string;
    purposeLabel: string;
    dataAttributesLabel: string;
    retentionPeriodLabel: string;
    acceptButton: string;
    acceptSelectedButton: string;
    cancelButton: string;
    selectAllLabel: string;
    languageLabel: string;
    privacyNoticeLink: string;
    grievanceLink: string;
    manageConsentText: string;
  };
  onAcceptAll?: () => void;
  onAcceptSelected?: (selectedActivities: string[]) => void;
  onCancel?: () => void;
  onLanguageChange?: (language: string) => void;
}

export function ConsentNoticeTemplate({
  activities,
  config,
  translations,
  onAcceptAll,
  onAcceptSelected,
  onCancel,
  onLanguageChange,
}: ConsentNoticeTemplateProps) {
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(config.language || 'en');

  const languageNames: Record<string, string> = {
    en: 'English',
    hi: 'हिंदी',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    bn: 'বাংলা',
    mr: 'मराठी',
    gu: 'ગુજરાતી',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
    pa: 'ਪੰਜਾਬੀ',
    or: 'ଓଡ଼ିଆ',
    ur: 'اردو',
    as: 'অসমীয়া',
  };

  const toggleActivity = (activityId: string) => {
    const newSelected = new Set(selectedActivities);
    if (newSelected.has(activityId)) {
      newSelected.delete(activityId);
    } else {
      newSelected.add(activityId);
    }
    setSelectedActivities(newSelected);
  };

  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const handleSelectAll = () => {
    if (selectedActivities.size === activities.length) {
      setSelectedActivities(new Set());
    } else {
      setSelectedActivities(new Set(activities.map(a => a.id)));
    }
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setShowLanguageDropdown(false);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const handleAcceptAll = () => {
    const allIds = activities.map(a => a.id);
    setSelectedActivities(new Set(allIds));
    if (onAcceptAll) {
      onAcceptAll();
    }
  };

  const handleAcceptSelected = () => {
    if (onAcceptSelected && selectedActivities.size > 0) {
      onAcceptSelected(Array.from(selectedActivities));
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <div 
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        style={{
          backgroundColor: config.backgroundColor,
          color: config.textColor,
          borderRadius: `${config.borderRadius}px`,
          animation: 'slideUp 0.4s ease-out',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: `${config.textColor}20` }}
        >
          <div className="flex items-center gap-4">
            {config.logo && (
              <img 
                src={config.logo} 
                alt={config.companyName}
                className="h-10 w-auto object-contain"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">{translations.noticeTitle}</h2>
              <p className="text-sm opacity-70 mt-1">{config.companyName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            {config.showLanguageSelector && config.supportedLanguages && config.supportedLanguages.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors hover:bg-opacity-10 hover:bg-gray-500"
                  style={{ 
                    borderColor: `${config.textColor}30`,
                    color: config.textColor 
                  }}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">{languageNames[selectedLanguage]}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showLanguageDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl border overflow-hidden z-10"
                    style={{ 
                      backgroundColor: config.backgroundColor,
                      borderColor: `${config.textColor}20`
                    }}
                  >
                    <div className="py-1">
                      {config.supportedLanguages.map(lang => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageSelect(lang)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            lang === selectedLanguage ? 'font-semibold' : ''
                          }`}
                          style={{
                            backgroundColor: lang === selectedLanguage ? `${config.primaryColor}15` : 'transparent',
                            color: config.textColor,
                          }}
                        >
                          <span className="flex items-center justify-between">
                            {languageNames[lang]}
                            {lang === selectedLanguage && (
                              <Check className="h-4 w-4" style={{ color: config.primaryColor }} />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onCancel}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-10 hover:bg-gray-500"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 pt-6 pb-4">
          <p className="text-sm leading-relaxed opacity-80">
            {translations.noticeDescription}
          </p>
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="space-y-3">
            {activities.flatMap((activity) => {
              // Use new structure if available, otherwise fall back to legacy
              const hasNewStructure = activity.purposes && activity.purposes.length > 0;
              
              if (hasNewStructure) {
                // Create a row for each purpose
                return activity.purposes!.map((purpose, purposeIdx) => {
                  const uniqueId = `${activity.id}-${purpose.id || purposeIdx}`;
                  const isSelected = selectedActivities.has(uniqueId);
                  const isExpanded = expandedActivities.has(uniqueId);
                  const dataCategories = purpose.dataCategories || [];

                  return (
                    <div
                      key={uniqueId}
                      className="rounded-xl border-2 overflow-hidden transition-all"
                      style={{
                        borderColor: isSelected ? config.primaryColor : `${config.textColor}15`,
                        backgroundColor: isSelected ? `${config.primaryColor}08` : 'transparent',
                      }}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <div className="pt-1">
                            <button
                              onClick={() => toggleActivity(uniqueId)}
                              className="flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all"
                              style={{
                                borderColor: isSelected ? config.primaryColor : `${config.textColor}30`,
                                backgroundColor: isSelected ? config.primaryColor : 'transparent',
                              }}
                            >
                              {isSelected && <Check className="h-4 w-4 text-white" />}
                            </button>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-base mb-1">
                                  {purpose.purposeName}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="inline-block text-xs font-medium px-2 py-1 rounded-md"
                                    style={{ 
                                      backgroundColor: `${config.primaryColor}20`,
                                      color: config.primaryColor 
                                    }}
                                  >
                                    {activity.industry}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {purpose.legalBasis.replace('-', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Expandable Details */}
                            <button
                              onClick={() => toggleExpanded(uniqueId)}
                              className="flex items-center gap-1 text-sm font-medium transition-colors"
                              style={{ color: config.primaryColor }}
                            >
                              {isExpanded ? (
                                <>
                                  <span>Hide details</span>
                                  <ChevronUp className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  <span>View details</span>
                                  <ChevronDown className="h-4 w-4" />
                                </>
                              )}
                            </button>

                            {isExpanded && (
                              <div 
                                className="mt-4 pt-4 border-t space-y-3"
                                style={{ borderColor: `${config.textColor}15` }}
                              >
                                {/* Data Categories */}
                                {dataCategories.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold opacity-60 uppercase tracking-wide mb-2">
                                      {translations.dataAttributesLabel}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {dataCategories.map((cat, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-1 rounded-md"
                                          style={{ 
                                            backgroundColor: `${config.textColor}08`,
                                            color: config.textColor 
                                          }}
                                        >
                                          {cat.categoryName} ({cat.retentionPeriod})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              } else {
                // Legacy structure
                const isSelected = selectedActivities.has(activity.id);
                const isExpanded = expandedActivities.has(activity.id);
                const dataAttributes = activity.data_attributes || [];

                return (
                  <div
                    key={activity.id}
                    className="rounded-xl border-2 overflow-hidden transition-all"
                    style={{
                      borderColor: isSelected ? config.primaryColor : `${config.textColor}15`,
                      backgroundColor: isSelected ? `${config.primaryColor}08` : 'transparent',
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <button
                            onClick={() => toggleActivity(activity.id)}
                            className="flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all"
                            style={{
                              borderColor: isSelected ? config.primaryColor : `${config.textColor}30`,
                              backgroundColor: isSelected ? config.primaryColor : 'transparent',
                            }}
                          >
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-base mb-1">
                                {activity.activity_name}
                              </h3>
                              <span 
                                className="inline-block text-xs font-medium px-2 py-1 rounded-md"
                                style={{ 
                                  backgroundColor: `${config.primaryColor}20`,
                                  color: config.primaryColor 
                                }}
                              >
                                {activity.industry}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm opacity-80 leading-relaxed mb-3">
                            {activity.purpose}
                          </p>

                          {/* Expandable Details */}
                          <button
                            onClick={() => toggleExpanded(activity.id)}
                            className="flex items-center gap-1 text-sm font-medium transition-colors"
                            style={{ color: config.primaryColor }}
                          >
                            {isExpanded ? (
                              <>
                                <span>Hide details</span>
                                <ChevronUp className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                <span>View details</span>
                                <ChevronDown className="h-4 w-4" />
                              </>
                            )}
                          </button>

                          {isExpanded && (
                            <div 
                              className="mt-4 pt-4 border-t space-y-3"
                              style={{ borderColor: `${config.textColor}15` }}
                            >
                              {/* Data Attributes */}
                              <div>
                                <p className="text-xs font-semibold opacity-60 uppercase tracking-wide mb-2">
                                  {translations.dataAttributesLabel}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {dataAttributes.map((attr, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 rounded-md"
                                      style={{ 
                                        backgroundColor: `${config.textColor}08`,
                                        color: config.textColor 
                                      }}
                                    >
                                      {attr}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Retention Period */}
                              <div>
                                <p className="text-xs font-semibold opacity-60 uppercase tracking-wide mb-1">
                                  {translations.retentionPeriodLabel}
                                </p>
                                <p className="text-sm opacity-90">{activity.retention_period}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Footer with Actions */}
        <div 
          className="border-t p-6"
          style={{ 
            borderColor: `${config.textColor}20`,
            backgroundColor: `${config.textColor}03`
          }}
        >
          {/* Select All */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: config.primaryColor }}
            >
              <div
                className="flex items-center justify-center w-5 h-5 rounded border-2 transition-all"
                style={{
                  borderColor: selectedActivities.size === activities.length ? config.primaryColor : `${config.textColor}30`,
                  backgroundColor: selectedActivities.size === activities.length ? config.primaryColor : 'transparent',
                }}
              >
                {selectedActivities.size === activities.length && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              {translations.selectAllLabel}
            </button>
            
            <p className="text-sm opacity-60">
              {selectedActivities.size} of {activities.length} selected
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap items-stretch">
            <button
              onClick={onCancel}
              className="flex-1 min-w-[140px] px-6 py-3.5 rounded-lg font-semibold border-2 transition-all text-center whitespace-nowrap overflow-hidden text-ellipsis"
              style={{
                borderColor: `${config.textColor}30`,
                color: config.textColor,
              }}
              title={translations.cancelButton}
            >
              {translations.cancelButton}
            </button>

            {selectedActivities.size > 0 && selectedActivities.size < activities.length && (
              <button
                onClick={handleAcceptSelected}
                className="flex-1 min-w-[140px] px-6 py-3.5 rounded-lg font-semibold border-2 transition-all text-center whitespace-nowrap overflow-hidden text-ellipsis"
                style={{
                  borderColor: config.primaryColor,
                  backgroundColor: `${config.primaryColor}15`,
                  color: config.primaryColor,
                }}
                title={translations.acceptSelectedButton}
              >
                {translations.acceptSelectedButton}
              </button>
            )}

            <button
              onClick={handleAcceptAll}
              className="flex-1 min-w-[140px] px-6 py-3.5 rounded-lg font-semibold shadow-lg transition-all hover:shadow-xl text-center whitespace-nowrap overflow-hidden text-ellipsis"
              style={{
                backgroundColor: config.primaryColor,
                color: '#ffffff',
                minHeight: '44px',
              }}
              title={translations.acceptButton}
            >
              {translations.acceptButton}
            </button>
          </div>

          {/* Footer Links */}
          {(config.privacyNoticeUrl || translations.grievanceLink) && (
            <div className="flex gap-4 justify-center mt-4 pt-4 border-t" style={{ borderColor: `${config.textColor}15` }}>
              {config.privacyNoticeUrl && (
                <a
                  href={config.privacyNoticeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium transition-colors underline"
                  style={{ color: config.primaryColor }}
                >
                  {translations.privacyNoticeLink}
                </a>
              )}
              {translations.grievanceLink && (
                <button
                  className="text-sm font-medium transition-colors underline"
                  style={{ color: config.primaryColor }}
                >
                  {translations.grievanceLink}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
