'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { TagInput } from '@/components/ui/tag-input';
import { PurposeManager } from '@/components/ui/purpose-manager';
import { processingActivitySchema, type ProcessingActivityStructuredInput } from '@/lib/schemas';
import { 
  COMMON_DATA_CATEGORIES, 
  DATA_SOURCES_SUGGESTIONS,
  DATA_RECIPIENTS_SUGGESTIONS 
} from '@/lib/data-categories';
import { 
  industryTemplates, 
  getLegalBasisLabel, 
  getIndustryLabel, 
  getIndustryIcon,
  type ActivityTemplate,
  type IndustryTemplate 
} from '@/lib/industry-templates';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Building2, 
  Search, 
  Filter, 
  Download, 
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Loader2,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

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
  userId: string;
  activityName: string;
  industry: string;
  purposes: Purpose[];
  dataSources: string[];
  dataRecipients: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProcessingActivitiesPage() {
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateDetailModal, setTemplateDetailModal] = useState(false);
  const [templateCustomizeModal, setTemplateCustomizeModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IndustryTemplate | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set());
  const [activityToCustomize, setActivityToCustomize] = useState<ActivityTemplate | null>(null);
  const [editingActivity, setEditingActivity] = useState<ProcessingActivity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<ProcessingActivityStructuredInput>({
    resolver: zodResolver(processingActivitySchema),
    defaultValues: {
      activityName: '',
      industry: 'e-commerce',
      purposes: [],
      dataSources: [],
      dataRecipients: [],
    },
  });

  // Fetch activities with pagination and filters
  useEffect(() => {
    fetchActivities();
  }, [currentPage, filterIndustry]);

  const fetchActivities = async () => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        industry: filterIndustry,
        status: 'all',
      });

      const response = await fetch(`/api/dpdpa/activities?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch activities');
      }
      
      setActivities(result.data || []);
      if (result.pagination) {
        setTotalPages(result.pagination.totalPages || 1);
        setTotalCount(result.pagination.total || 0);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: ProcessingActivityStructuredInput) => {
    setIsLoading(true);
    try {
      const payload = {
        activityName: data.activityName,
        industry: data.industry,
        purposes: data.purposes,
        dataSources: data.dataSources,
        dataRecipients: data.dataRecipients || [],
      };
      
      if (editingActivity) {
        // Update existing activity
        const response = await fetch('/api/dpdpa/activities', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingActivity.id, ...payload }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to update activity');
        }
        
        toast.success('Activity updated successfully');
      } else {
        // Create new activity
        const response = await fetch('/api/dpdpa/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create activity');
        }
        
        toast.success('Activity created successfully');
      }
      
      // Refresh activities list
      await fetchActivities();
      
      setModalOpen(false);
      setEditingActivity(null);
      reset();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (activity: ProcessingActivity) => {
    setEditingActivity(activity);
    setValue('activityName', activity.activityName);
    setValue('industry', activity.industry as any);
    setValue('purposes', activity.purposes);
    setValue('dataSources', activity.dataSources || []);
    setValue('dataRecipients', activity.dataRecipients || []);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        const response = await fetch(`/api/dpdpa/activities?id=${id}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete activity');
        }
        
        toast.success('Activity deleted successfully');
        await fetchActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete activity');
      }
    }
  };

  const handleAddNew = () => {
    setEditingActivity(null);
    reset();
    setModalOpen(true);
  };

  const handleSelectTemplate = (template: IndustryTemplate) => {
    setSelectedTemplate(template);
    setSelectedActivities(new Set());
    setTemplateDetailModal(true);
  };

  const toggleActivitySelection = (index: number) => {
    const newSelection = new Set(selectedActivities);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedActivities(newSelection);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || selectedActivities.size === 0) {
      toast.error('Please select at least one activity');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all purposes to get their IDs
      const purposesResponse = await fetch('/api/dpdpa/purposes');
      if (!purposesResponse.ok) {
        throw new Error('Failed to fetch purposes');
      }
      const purposesData = await purposesResponse.json();
      console.log('Available purposes:', purposesData.data);
      const purposesMap = new Map(purposesData.data.map((p: any) => [p.purpose_name, p.id]));
      console.log('Purposes map:', Array.from(purposesMap.keys()));

      const activitiesToCreate = Array.from(selectedActivities).map(index => {
        const activity = selectedTemplate.activities[index];
        console.log('Processing activity:', activity.activity_name);
        
        // Check if activity uses new structure (purposes array) or legacy structure
        if (activity.purposes && activity.purposes.length > 0) {
          // New structure: map purpose names to IDs
          const mappedPurposes = activity.purposes.map((purpose: any) => {
            const purposeId = purposesMap.get(purpose.purposeName);
            if (!purposeId) {
              console.error(`Purpose not found: ${purpose.purposeName}. Available:`, Array.from(purposesMap.keys()));
              // Fallback to Account Management
              return {
                purposeId: purposesMap.get('Account Management')!,
                purposeName: purpose.purposeName,
                legalBasis: purpose.legalBasis,
                customDescription: purpose.customDescription || `Original purpose: ${purpose.purposeName}`,
                dataCategories: purpose.dataCategories.map((cat: any) => ({
                  categoryName: cat.categoryName,
                  retentionPeriod: cat.retentionPeriod,
                })),
              };
            }
            return {
              purposeId: purposeId,
              purposeName: purpose.purposeName,
              legalBasis: purpose.legalBasis,
              customDescription: purpose.customDescription,
              dataCategories: purpose.dataCategories.map((cat: any) => ({
                categoryName: cat.categoryName,
                retentionPeriod: cat.retentionPeriod,
              })),
            };
          });
          
          return {
            activityName: activity.activity_name,
            industry: selectedTemplate.industry,
            purposes: mappedPurposes,
            dataSources: activity.data_sources || [],
            dataRecipients: activity.data_recipients || [],
          };
        } else {
          // Legacy structure: convert to new format
          const defaultPurposeName = activity.purpose?.split('.')[0]?.trim() || 'Account Management';
          const purposeId = purposesMap.get(defaultPurposeName) || purposesMap.get('Account Management');
          
          if (!purposeId) {
            console.error(`No purposes found in database! Available:`, Array.from(purposesMap.keys()));
            throw new Error('Account Management purpose not found in database. Please run database migrations.');
          }
          
          console.log(`Using purpose: ${defaultPurposeName} -> ${purposeId}`);
          
          return {
            activityName: activity.activity_name,
            industry: selectedTemplate.industry,
            purposes: [
              {
                purposeId: purposeId,
                purposeName: defaultPurposeName,
                legalBasis: (activity.legalBasis as any) || 'consent',
                customDescription: activity.purpose,
                dataCategories: (activity.data_attributes || []).map((attr: string) => ({
                  categoryName: attr,
                  retentionPeriod: activity.retention_period || '3 years from last activity',
                })),
              },
            ],
            dataSources: activity.data_processors?.sources || [],
            dataRecipients: [],
          };
        }
      });
      
      console.log('Activities to create:', activitiesToCreate);

      // Create activities in sequence
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];
      const createdActivities: ProcessingActivity[] = [];

      for (const activity of activitiesToCreate) {
        try {
          console.log('Sending activity payload:', JSON.stringify(activity, null, 2));
          const response = await fetch('/api/dpdpa/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activity),
          });

          if (response.ok) {
            const result = await response.json();
            createdActivities.push(result.data);
            successCount++;
          } else {
            const errorData = await response.json();
            console.error('Failed to create activity:', errorData);
            console.error('Failed activity payload was:', JSON.stringify(activity, null, 2));
            errors.push(errorData.error || 'Unknown error');
            failCount++;
          }
        } catch (error) {
          console.error('Error creating activity:', error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} ${successCount === 1 ? 'activity' : 'activities'}. Opening for customization...`);
      }
      if (failCount > 0) {
        toast.error(`Failed to create ${failCount} ${failCount === 1 ? 'activity' : 'activities'}`);
      }

      // Refresh activities list
      await fetchActivities();

      setTemplateDetailModal(false);
      setTemplateModalOpen(false);
      setSelectedTemplate(null);
      setSelectedActivities(new Set());

      // If only one activity was created, open it for editing immediately
      if (createdActivities.length === 1) {
        const activity = createdActivities[0];
        // Small delay to ensure UI is ready
        setTimeout(() => {
          handleEdit(activity);
        }, 300);
      } else if (createdActivities.length > 1) {
        // For multiple activities, show a message
        toast.info('You can now edit each activity to customize data categories and retention periods');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportActivities = () => {
    const dataStr = JSON.stringify(activities, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dpdpa-activities-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Activities exported successfully');
  };

  // Filter activities based on search query
  const filteredActivities = useMemo(() => {
    if (!searchQuery) return activities;
    const query = searchQuery.toLowerCase();
    return activities.filter(activity => {
      const matchesName = activity.activityName?.toLowerCase().includes(query);
      const matchesPurpose = activity.purposes?.some(p => 
        p.purposeName?.toLowerCase().includes(query)
      );
      const matchesCategory = activity.purposes?.some(p =>
        p.dataCategories?.some(cat => cat.categoryName?.toLowerCase().includes(query))
      );
      return matchesName || matchesPurpose || matchesCategory;
    });
  }, [activities, searchQuery]);

  // Industry statistics
  const industryStats = useMemo(() => {
    const stats = new Map<string, number>();
    activities.forEach(activity => {
      stats.set(activity.industry, (stats.get(activity.industry) || 0) + 1);
    });
    return stats;
  }, [activities]);

  if (isFetching && activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Processing Activities</h1>
          <p className="text-gray-600 mt-2">
            Manage your DPDPA 2023 compliant data processing activities
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportActivities}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setTemplateModalOpen(true)}>
            <Building2 className="mr-2 h-4 w-4" />
            Industry Templates
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filterIndustry}
          onChange={(e) => {
            setFilterIndustry(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Industries</option>
          {industryTemplates.map(template => (
            <option key={template.industry} value={template.industry}>
              {template.icon} {template.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activities.filter(a => a.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Industries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{industryStats.size}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredActivities.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search query' : 'Get started by creating your first activity or using an industry template'}
            </p>
            {!searchQuery && (
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setTemplateModalOpen(true)} variant="outline">
                  <Building2 className="mr-2 h-4 w-4" />
                  Use Template
                </Button>
                <Button onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Activity
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Activity Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{getIndustryIcon(activity.industry)}</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{activity.activityName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getIndustryLabel(activity.industry)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {activity.purposes?.length || 0} {activity.purposes?.length === 1 ? 'Purpose' : 'Purposes'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Purposes Section */}
                    <div className="space-y-3 mb-4">
                      {activity.purposes && activity.purposes.length > 0 ? (
                        activity.purposes.slice(0, 2).map((purpose, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900">{purpose.purposeName}</h4>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 mt-1">
                                  {purpose.legalBasis.replace('-', ' ')}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-500 mb-1">Data Categories:</p>
                              <div className="flex flex-wrap gap-1">
                                {purpose.dataCategories?.slice(0, 4).map((cat, catIdx) => (
                                  <span key={catIdx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white border border-gray-300 text-gray-700">
                                    {cat.categoryName}
                                  </span>
                                ))}
                                {purpose.dataCategories && purpose.dataCategories.length > 4 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white border border-gray-300 text-gray-700">
                                    +{purpose.dataCategories.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center text-sm text-gray-500">
                          No purposes configured
                        </div>
                      )}
                      {activity.purposes && activity.purposes.length > 2 && (
                        <p className="text-xs text-gray-500 italic">
                          +{activity.purposes.length - 2} more {activity.purposes.length - 2 === 1 ? 'purpose' : 'purposes'}...
                        </p>
                      )}
                    </div>

                    {/* Data Sources & Recipients */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Data Sources</p>
                        <p className="text-sm text-gray-700">
                          {activity.dataSources?.length || 0} {activity.dataSources?.length === 1 ? 'source' : 'sources'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Data Recipients</p>
                        <p className="text-sm text-gray-700">
                          {activity.dataRecipients?.length || 0} {activity.dataRecipients?.length === 1 ? 'recipient' : 'recipients'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Link href={`/dashboard/dpdpa/activity-stats/${activity.id}`}>
                      <Button variant="ghost" size="sm" title="View Stats">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(activity)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(activity.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} activities
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingActivity(null);
          reset();
        }}
        title={editingActivity ? '✏️ Customize Processing Activity' : 'Add Processing Activity'}
        description={editingActivity ? 'Customize data categories and retention periods to match your needs' : undefined}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            {...register('activityName')}
            label="Activity Name"
            placeholder="e.g., Customer Registration, Order Processing"
            error={errors.activityName?.message}
            required
          />

          <Select
            {...register('industry')}
            label="Industry"
            error={errors.industry?.message}
            required
          >
            {industryTemplates.map(template => (
              <option key={template.industry} value={template.industry}>
                {template.icon} {template.name}
              </option>
            ))}
          </Select>

          {/* Purpose Manager - Main Component */}
          <Controller
            name="purposes"
            control={control}
            render={({ field }) => (
              <PurposeManager
                value={field.value}
                onChange={field.onChange}
                industry={watch('industry')}
                label="Purposes & Data Categories"
                error={errors.purposes?.message}
                required
              />
            )}
          />

          <Controller
            name="dataSources"
            control={control}
            render={({ field }) => (
              <TagInput
                value={field.value}
                onChange={field.onChange}
                label="Data Sources"
                placeholder="Type and press Enter to add (e.g., Website Registration Form, Mobile App)"
                suggestions={DATA_SOURCES_SUGGESTIONS}
                helperText="Specify where you collect the data from. Start typing to see suggestions."
                error={errors.dataSources?.message}
                required
              />
            )}
          />

          <Controller
            name="dataRecipients"
            control={control}
            render={({ field }) => (
              <TagInput
                value={field.value || []}
                onChange={field.onChange}
                label="Data Recipients (Optional)"
                placeholder="Type and press Enter to add (e.g., Analytics Providers, Marketing Partners)"
                suggestions={DATA_RECIPIENTS_SUGGESTIONS}
                helperText="Specify third parties who receive the data. Optional field."
                error={errors.dataRecipients?.message}
              />
            )}
          />

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingActivity(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingActivity ? 'Update Activity' : 'Create Activity'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Industry Templates Modal */}
      <Modal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title="Industry Templates"
        description="Pre-configured processing activities for your industry"
        size="lg"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {industryTemplates.map((template) => (
            <Card 
              key={template.industry} 
              className="hover:shadow-md transition-all cursor-pointer hover:border-blue-500"
              onClick={() => handleSelectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">{template.activities?.length || 0} Activities Included:</p>
                  <ul className="space-y-1">
                    {template.activities && template.activities.slice(0, 3).map((activity, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center">
                        <Check className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                        {activity.activity_name}
                      </li>
                    ))}
                    {template.activities && template.activities.length > 3 && (
                      <li className="text-sm text-gray-500 italic">
                        +{template.activities.length - 3} more activities...
                      </li>
                    )}
                  </ul>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  View & Select Activities
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Template Detail Modal */}
      <Modal
        open={templateDetailModal}
        onClose={() => {
          setTemplateDetailModal(false);
          setSelectedTemplate(null);
          setSelectedActivities(new Set());
        }}
        title={selectedTemplate ? `${selectedTemplate.icon} ${selectedTemplate.name}` : 'Template Details'}
        description="Review and customize activities before adding them"
        size="xl"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Fully Customizable:</strong> These are just suggestions. You can select which data categories you need and set custom retention periods for each activity.
              </p>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedTemplate.activities.map((activity, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all ${
                    selectedActivities.has(index) ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                  }`}
                  onClick={() => toggleActivitySelection(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {selectedActivities.has(index) ? (
                          <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{activity.activity_name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{activity.purpose}</p>
                        
                        <div className="text-sm">
                          <p className="font-medium text-gray-700 mb-2">
                            {activity.purposes ? `${activity.purposes.length} Purpose(s)` : '1 Purpose'} with multiple data categories
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {activity.purposes ? (
                              // New structure: show data categories from first purpose
                              activity.purposes[0]?.dataCategories?.slice(0, 6).map((cat, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                  {cat.categoryName}
                                </span>
                              ))
                            ) : (
                              // Legacy structure: show data attributes
                              activity.data_attributes?.slice(0, 6).map((attr, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                  {attr}
                                </span>
                              ))
                            )}
                            {(activity.purposes ? 
                              (activity.purposes[0]?.dataCategories?.length || 0) > 6 : 
                              (activity.data_attributes?.length || 0) > 6
                            ) && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                +{(activity.purposes ? 
                                  (activity.purposes[0]?.dataCategories?.length || 0) - 6 : 
                                  (activity.data_attributes?.length || 0) - 6
                                )} more
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Click to customize data categories and retention periods
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                {selectedActivities.size} of {selectedTemplate.activities.length} activities selected
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTemplateDetailModal(false);
                    setSelectedTemplate(null);
                    setSelectedActivities(new Set());
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyTemplate}
                  disabled={selectedActivities.size === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add {selectedActivities.size} {selectedActivities.size === 1 ? 'Activity' : 'Activities'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
