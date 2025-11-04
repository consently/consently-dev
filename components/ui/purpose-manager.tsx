'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
import { TagInput } from './tag-input';
import { Textarea } from './textarea';
import { Card, CardContent } from './card';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { COMMON_DATA_CATEGORIES } from '@/lib/data-categories';
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
      }
    } catch (error) {
      console.error('Error fetching purposes:', error);
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

  const handleDataCategoryChange = (purposeIndex: number, categoryIndex: number, field: 'categoryName' | 'retentionPeriod', fieldValue: string) => {
    const newPurposes = [...value];
    const newCategories = [...newPurposes[purposeIndex].dataCategories];
    newCategories[categoryIndex] = { ...newCategories[categoryIndex], [field]: fieldValue };
    newPurposes[purposeIndex] = { ...newPurposes[purposeIndex], dataCategories: newCategories };
    onChange(newPurposes);
  };

  const handleAddDataCategory = (purposeIndex: number) => {
    const newPurposes = [...value];
    newPurposes[purposeIndex].dataCategories.push({
      categoryName: '',
      retentionPeriod: '',
    });
    onChange(newPurposes);
  };

  const handleRemoveDataCategory = (purposeIndex: number, categoryIndex: number) => {
    const newPurposes = [...value];
    newPurposes[purposeIndex].dataCategories = newPurposes[purposeIndex].dataCategories.filter((_, i) => i !== categoryIndex);
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
        body: JSON.stringify({ purposeName: newPurposeName }),
      });

      if (response.ok) {
        const result = await response.json();
        setAvailablePurposes([...availablePurposes, result.data]);
        setNewPurposeName('');
        setShowCustomPurposeInput(false);
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to create custom purpose');
      }
    } catch (error) {
      console.error('Error creating purpose:', error);
      alert('Failed to create custom purpose');
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Data Categories & Retention
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddDataCategory(purposeIndex)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Category
                        </Button>
                      </div>

                      {purpose.dataCategories.length === 0 ? (
                        <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                          No data categories added. Click "Add Category" to add data categories for this purpose.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {purpose.dataCategories.map((category, categoryIndex) => (
                            <div key={categoryIndex} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={category.categoryName}
                                  onChange={(e) => handleDataCategoryChange(purposeIndex, categoryIndex, 'categoryName', e.target.value)}
                                  placeholder="e.g., Email Address, Phone Number"
                                  list={`categories-${purposeIndex}-${categoryIndex}`}
                                  required
                                />
                                <datalist id={`categories-${purposeIndex}-${categoryIndex}`}>
                                  {COMMON_DATA_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat} />
                                  ))}
                                </datalist>
                                <Input
                                  value={category.retentionPeriod}
                                  onChange={(e) => handleDataCategoryChange(purposeIndex, categoryIndex, 'retentionPeriod', e.target.value)}
                                  placeholder="e.g., 3 years, Until account deletion"
                                  required
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDataCategory(purposeIndex, categoryIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
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
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Create Custom Purpose</h4>
              <Input
                value={newPurposeName}
                onChange={(e) => setNewPurposeName(e.target.value)}
                placeholder="Enter purpose name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCustomPurpose();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCreateCustomPurpose}
                  disabled={!newPurposeName.trim() || isCreatingPurpose}
                  size="sm"
                >
                  {isCreatingPurpose ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustomPurposeInput(false);
                    setNewPurposeName('');
                  }}
                  size="sm"
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
