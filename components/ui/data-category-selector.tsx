'use client';

import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent } from './card';
import { Plus, Trash2, Search, X } from 'lucide-react';
import { COMMON_DATA_CATEGORIES } from '@/lib/data-categories';

interface DataCategory {
  categoryName: string;
  retentionPeriod: string;
}

interface DataCategorySelectorProps {
  value: DataCategory[];
  onChange: (value: DataCategory[]) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

const RETENTION_PERIOD_SUGGESTIONS = [
  '1 year',
  '2 years',
  '3 years',
  '5 years',
  '7 years',
  '10 years',
  'Until account deletion',
  'Until consent withdrawal',
  'Until service termination',
  '30 days',
  '90 days',
  '180 days',
  'As long as needed for service',
  'As required by law',
];

export function DataCategorySelector({
  value = [],
  onChange,
  label,
  required,
  error,
}: DataCategorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  const handleAddCategory = (categoryName?: string) => {
    const newCategory: DataCategory = {
      categoryName: categoryName || '',
      retentionPeriod: '',
    };
    onChange([...value, newCategory]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemoveCategory = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, field: keyof DataCategory, fieldValue: string) => {
    const newCategories = [...value];
    newCategories[index] = { ...newCategories[index], [field]: fieldValue };
    onChange(newCategories);
  };

  const handleBulkAdd = (categories: string[]) => {
    const newCategories = categories.map(cat => ({
      categoryName: cat,
      retentionPeriod: '',
    }));
    onChange([...value, ...newCategories]);
  };

  const filteredSuggestions = COMMON_DATA_CATEGORIES.filter(cat => 
    cat.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !value.some(v => v.categoryName.toLowerCase() === cat.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Quick Add Popular Categories */}
      {value.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Add Common Categories:</p>
            <div className="flex flex-wrap gap-2">
              {['Email', 'Name', 'Phone Number', 'Address', 'Date of Birth'].map(cat => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddCategory(cat)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {cat}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Add */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search or type a data category name..."
              className="pl-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            onClick={() => handleAddCategory(searchQuery)}
            disabled={!searchQuery.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && searchQuery && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSuggestions.slice(0, 10).map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddCategory(cat)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0"
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Categories */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Selected Categories ({value.length})
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange([])}
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {value.map((category, index) => (
              <Card key={index} className="border border-gray-200 bg-white">
                <CardContent className="p-3">
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      {/* Category Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Data Category
                        </label>
                        <Input
                          value={category.categoryName}
                          onChange={(e) => handleCategoryChange(index, 'categoryName', e.target.value)}
                          placeholder="e.g., Email Address"
                          list={`category-suggestions-${index}`}
                          className="text-sm"
                          required
                        />
                        <datalist id={`category-suggestions-${index}`}>
                          {COMMON_DATA_CATEGORIES.map(cat => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      </div>

                      {/* Retention Period */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Retention Period
                        </label>
                        <Input
                          value={category.retentionPeriod}
                          onChange={(e) => handleCategoryChange(index, 'retentionPeriod', e.target.value)}
                          placeholder="e.g., 3 years"
                          list={`retention-suggestions-${index}`}
                          className="text-sm"
                          required
                        />
                        <datalist id={`retention-suggestions-${index}`}>
                          {RETENTION_PERIOD_SUGGESTIONS.map(period => (
                            <option key={period} value={period} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCategory(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">No data categories added yet</p>
          <p className="text-xs text-gray-400">Search and add categories above, or use quick add buttons</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
