'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
import { TagInput } from './tag-input';
import { Textarea } from './textarea';
import { Card, CardContent } from './card';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { DataCategorySelector } from './data-category-selector';
import type { ActivityPurposeInput } from '@/lib/schemas';

interface Purpose {
  id: string;
  purpose_name: string;
  description?: string;
  is_predefined: boolean;
}

interface PurposeManagerProps {
  value: ActivityPurposeInput[];
  onChange: (value: ActivityPurposeInput[]) => void;
  industry: string;
  label?: string;
  error?: string;
  required?: boolean;
}

export function PurposeManager({
  value = [],
  onChange,
  industry,
  label,
  error,
  required,
}: PurposeManagerProps) {
  const [availablePurposes, setAvailablePurposes] = useState<Purpose[]>([]);
  const [isLoadingPurposes, setIsLoadingPurposes] = useState(true);
  const [expandedPurposes, setExpandedPurposes] = useState<Set<number>>(new Set());
  const [showCustomPurposeInput, setShowCustomPurposeInput] = useState(false);
  const [newPurposeName, setNewPurposeName] = useState('');
  const [newPurposeDescription, setNewPurposeDescription] = useState('');
  const [newDataSources, setNewDataSources] = useState<string[]>([]);
  const [newDataRecipients, setNewDataRecipients] = useState<string[]>([]);
  const [isCreatingPurpose, setIsCreatingPurpose] = useState(false);

  // Fetch available purposes
  useEffect(() => {
    fetchPurposes();
  }, []);

  const fetchPurposes = async () => {
    setIsLoadingPurposes(true);
    try {
      const response = await fetch('/api/dpdpa/purposes');
      const result = await response.json();
      if (response.ok) {
        setAvailablePurposes(result.data || []);
      } else {
        console.error('[PurposeManager] Failed to fetch purposes:', result.error, result.details);
        // Still set empty array to allow UI to function
        setAvailablePurposes([]);
      }
    } catch (error) {
      console.error('[PurposeManager] Error fetching purposes:', error);
      // Still set empty array to allow UI to function
      setAvailablePurposes([]);
    } finally {
      setIsLoadingPurposes(false);
    }
  };

  const handleAddPurpose = () => {
    const newPurpose: ActivityPurposeInput = {
      purposeId: '', // Will be set when user selects from dropdown
      legalBasis: 'consent',
      customDescription: '',
      dataCategories: [],
    };
    onChange([...value, newPurpose]);
    setExpandedPurposes(new Set([...expandedPurposes, value.length]));
  };

  const handleRemovePurpose = (index: number) => {
    const newPurposes = value.filter((_, i) => i !== index);
    onChange(newPurposes);
    expandedPurposes.delete(index);
    setExpandedPurposes(new Set(expandedPurposes));
  };

  const handlePurposeChange = (index: number, field: keyof ActivityPurposeInput, fieldValue: any) => {
    const newPurposes = [...value];
    newPurposes[index] = { ...newPurposes[index], [field]: fieldValue };
    onChange(newPurposes);
  };

  const handleDataCategoriesChange = (purposeIndex: number, categories: Array<{categoryName: string; retentionPeriod: string}>) => {
    const newPurposes = [...value];
    newPurposes[purposeIndex] = { ...newPurposes[purposeIndex], dataCategories: categories };
    onChange(newPurposes);
  };

  const togglePurposeExpanded = (index: number) => {
    const newExpanded = new Set(expandedPurposes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPurposes(newExpanded);
  };

  const handleCreateCustomPurpose = async () => {
    if (!newPurposeName.trim()) return;

    setIsCreatingPurpose(true);
    try {
      const response = await fetch('/api/dpdpa/purposes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          purposeName: newPurposeName.trim(),
          description: newPurposeDescription.trim() || null,
          dataSources: newDataSources,
          dataRecipients: newDataRecipients
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Refetch purposes to ensure consistency
        await fetchPurposes();
        
        // Add a new purpose with the newly created ID
        const newPurpose: ActivityPurposeInput = {
          purposeId: result.data.id,
          legalBasis: 'consent',
          customDescription: '',
          dataCategories: [],
        };
        onChange([...value, newPurpose]);
        setExpandedPurposes(new Set([...expandedPurposes, value.length]));
        
        // Reset form
        setNewPurposeName('');
        setNewPurposeDescription('');
        setNewDataSources([]);
        setNewDataRecipients([]);
        setShowCustomPurposeInput(false);
      } else {
        const result = await response.json();
        
        // Handle duplicate purpose (409 Conflict)
        if (response.status === 409 && result.existingPurpose) {
          // Refetch purposes to ensure we have the latest list
          await fetchPurposes();
          
          // Use the existing purpose info from the API response
          const existingPurpose = result.existingPurpose;
          
          // Add the existing purpose to the form
          const newPurpose: ActivityPurposeInput = {
            purposeId: existingPurpose.id,
            legalBasis: 'consent',
            customDescription: '',
            dataCategories: [],
          };
          onChange([...value, newPurpose]);
          setExpandedPurposes(new Set([...expandedPurposes, value.length]));
          
          // Reset form
          setNewPurposeName('');
          setNewPurposeDescription('');
          setNewDataSources([]);
          setNewDataRecipients([]);
          setShowCustomPurposeInput(false);
          
          // Show appropriate message based on whether it's predefined or custom
          const purposeType = existingPurpose.isPredefined ? 'predefined' : 'custom';
          alert(`The ${purposeType} purpose "${existingPurpose.purposeName}" already exists and has been added to your activity.`);
          return;
        }
        
        // Handle other errors
        const errorMessage = result.details 
          ? `${result.error}: ${result.details}` 
          : result.error || 'Failed to create custom purpose';
        console.error('Error creating purpose:', result);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error creating purpose:', error);
      alert(`Failed to create custom purpose: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingPurpose(false);
    }
  };

  const getPurposeName = (purposeId: string) => {
    const purpose = availablePurposes.find(p => p.id === purposeId);
    return purpose?.purpose_name || 'Select a purpose';
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Purpose Cards */}
      <div className="space-y-3">
        {value.map((purpose, purposeIndex) => {
          const isExpanded = expandedPurposes.has(purposeIndex);
          const purposeName = getPurposeName(purpose.purposeId);
          const hasErrors = !purpose.purposeId || purpose.dataCategories.length === 0;

          return (
            <Card key={purposeIndex} className={`border-2 ${hasErrors ? 'border-red-200' : 'border-gray-200'}`}>
              <CardContent className="p-4">
                {/* Purpose Header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => togglePurposeExpanded(purposeIndex)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="font-semibold text-gray-900">
                      Purpose {purposeIndex + 1}: {purposeName}
                    </span>
                    {hasErrors && (
                      <AlertCircle className="h-4 w-4 text-red-500" title="Incomplete purpose configuration" />
                    )}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePurpose(purposeIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Purpose Details (Expanded) */}
                {isExpanded && (
                  <div className="space-y-4 pt-3 border-t">
                    {/* Purpose Selection */}
                    <div>
                      <Select
                        value={purpose.purposeId}
                        onChange={(e) => handlePurposeChange(purposeIndex, 'purposeId', e.target.value)}
                        label="Select Purpose"
                        required
                      >
                        <option value="">-- Select Purpose --</option>
                        <optgroup label="Predefined Purposes">
                          {availablePurposes
                            .filter(p => p.is_predefined)
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                {p.purpose_name}
                              </option>
                            ))}
                        </optgroup>
                        {availablePurposes.some(p => !p.is_predefined) && (
                          <optgroup label="Custom Purposes">
                            {availablePurposes
                              .filter(p => !p.is_predefined)
                              .map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.purpose_name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </Select>
                    </div>

                    {/* Legal Basis */}
                    <div>
                      <Select
                        value={purpose.legalBasis}
                        onChange={(e) => handlePurposeChange(purposeIndex, 'legalBasis', e.target.value as any)}
                        label="Legal Basis"
                        required
                      >
                        <option value="consent">Consent</option>
                        <option value="contract">Contract</option>
                        <option value="legal-obligation">Legal Obligation</option>
                        <option value="legitimate-interest">Legitimate Interest</option>
                      </Select>
                    </div>

                    {/* Custom Description */}
                    <div>
                      <Textarea
                        value={purpose.customDescription || ''}
                        onChange={(e) => handlePurposeChange(purposeIndex, 'customDescription', e.target.value)}
                        label="Additional Context (Optional)"
                        placeholder="Add any specific details about this purpose..."
                        rows={2}
                      />
                    </div>

                    {/* Data Categories Section */}
                    <div>
                      <DataCategorySelector
                        value={purpose.dataCategories}
                        onChange={(categories) => handleDataCategoriesChange(purposeIndex, categories)}
                        label="Data Categories & Retention"
                        required
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Purpose Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddPurpose}
          className="flex-1"
          disabled={isLoadingPurposes}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Purpose
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCustomPurposeInput(!showCustomPurposeInput)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Custom Purpose
        </Button>
      </div>

      {/* Create Custom Purpose Input */}
      {showCustomPurposeInput && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">Create Custom Purpose</h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomPurposeInput(false);
                    setNewPurposeName('');
                    setNewPurposeDescription('');
                    setNewDataSources([]);
                    setNewDataRecipients([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <Input
                  value={newPurposeName}
                  onChange={(e) => setNewPurposeName(e.target.value)}
                  placeholder="e.g., Marketing Analytics"
                  label="Purpose Name"
                  required
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateCustomPurpose();
                    }
                  }}
                />
                <Textarea
                  value={newPurposeDescription}
                  onChange={(e) => setNewPurposeDescription(e.target.value)}
                  placeholder="Provide a brief description of this purpose..."
                  label="Description (Optional)"
                  rows={3}
                />
                
                <TagInput
                  value={newDataSources}
                  onChange={setNewDataSources}
                  label="Data Sources"
                  placeholder="e.g., Website Registration Form"
                  suggestions={['Website Registration Form', 'Mobile App', 'Social Login APIs', 'Contact Form', 'Payment Gateway']}
                />
                
                <TagInput
                  value={newDataRecipients}
                  onChange={setNewDataRecipients}
                  label="Data Recipients (Optional)"
                  placeholder="e.g., Internal Teams"
                  suggestions={['Internal Teams', 'Cloud Storage Providers', 'Analytics Partners', 'Marketing Platforms', 'Payment Processors']}
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleCreateCustomPurpose}
                  disabled={!newPurposeName.trim() || isCreatingPurpose}
                  className="flex-1"
                >
                  {isCreatingPurpose ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Purpose
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustomPurposeInput(false);
                    setNewPurposeName('');
                    setNewPurposeDescription('');
                    setNewDataSources([]);
                    setNewDataRecipients([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
