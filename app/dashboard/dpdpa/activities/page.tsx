'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { processingActivitySchema, type ProcessingActivityInput } from '@/lib/schemas';
import { Plus, Edit, Trash2, FileText, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProcessingActivity {
  id: string;
  activity_name: string;
  purpose: string;
  industry: string;
  data_attributes: string[];
  retention_period: string;
  data_processors?: any;
  is_active: boolean;
  created_at: string;
}

const industryTemplates = [
  {
    industry: 'e-commerce',
    name: 'E-commerce Template',
    activities: ['Customer Registration', 'Order Processing', 'Payment Processing', 'Marketing Communications'],
  },
  {
    industry: 'banking',
    name: 'Banking Template',
    activities: ['Account Opening', 'KYC Verification', 'Transaction Processing', 'Credit Assessment'],
  },
  {
    industry: 'healthcare',
    name: 'Healthcare Template',
    activities: ['Patient Registration', 'Medical Records', 'Appointment Management', 'Prescription Management'],
  },
];

export default function ProcessingActivitiesPage() {
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ProcessingActivity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProcessingActivityInput>({
    resolver: zodResolver(processingActivitySchema),
  });

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/dpdpa/activities');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch activities');
      }
      
      setActivities(result.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: ProcessingActivityInput) => {
    setIsLoading(true);
    try {
      // Data is already in array format from the schema
      const dataCategories = data.dataCategories;
      const dataSources = data.dataSources || [];

      const payload = {
        activity_name: data.name,
        purpose: data.description,
        industry: data.legalBasis, // Using legalBasis as industry for now
        data_attributes: dataCategories,
        retention_period: data.retentionPeriod,
        data_processors: { sources: dataSources },
        is_active: true,
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

  const legalBasisLabels: Record<string, string> = {
    consent: 'Consent',
    contract: 'Contract',
    'legal-obligation': 'Legal Obligation',
    'legitimate-interest': 'Legitimate Interest',
    'e-commerce': 'E-commerce',
    'banking': 'Banking',
    'healthcare': 'Healthcare',
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
        <div className="flex gap-4">
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">E-commerce</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.industry === 'e-commerce').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      <div className="grid gap-4">
        {activities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{activity.activity_name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{activity.purpose}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Industry</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {legalBasisLabels[activity.industry] || activity.industry}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Data Attributes</p>
                      <div className="flex flex-wrap gap-1">
                        {activity.data_attributes.slice(0, 2).map((cat, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {cat}
                          </span>
                        ))}
                        {activity.data_attributes.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            +{activity.data_attributes.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Retention Period</p>
                      <p className="text-sm font-medium text-gray-900">{activity.retention_period}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
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

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingActivity(null);
          reset();
        }}
        title={editingActivity ? 'Edit Processing Activity' : 'Add Processing Activity'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('name')}
            label="Activity Name"
            placeholder="e.g., User Registration"
            error={errors.name?.message}
            defaultValue={editingActivity?.activity_name}
            required
          />

          <Textarea
            {...register('description')}
            label="Description"
            placeholder="Describe the data processing activity..."
            error={errors.description?.message}
            defaultValue={editingActivity?.purpose}
            rows={3}
            required
          />

          <Select
            {...register('legalBasis')}
            label="Legal Basis"
            options={[
              { value: 'consent', label: 'Consent' },
              { value: 'contract', label: 'Contract' },
              { value: 'legal-obligation', label: 'Legal Obligation' },
              { value: 'legitimate-interest', label: 'Legitimate Interest' },
            ]}
            error={errors.legalBasis?.message}
            defaultValue={editingActivity?.industry}
            required
          />

          <Input
            {...register('dataCategories')}
            label="Data Categories"
            placeholder="Email, Name, Phone (comma separated)"
            helperText="Enter data categories separated by commas"
            error={errors.dataCategories?.message}
            defaultValue={editingActivity?.data_attributes.join(', ')}
            required
          />

          <Input
            {...register('retentionPeriod')}
            label="Retention Period"
            placeholder="e.g., 2 years, 90 days"
            error={errors.retentionPeriod?.message}
            defaultValue={editingActivity?.retention_period}
            required
          />

          <Input
            {...register('dataSources')}
            label="Data Sources"
            placeholder="Website forms, API, Mobile app (comma separated)"
            helperText="Enter data sources separated by commas"
            error={errors.dataSources?.message}
            required
          />

          <div className="flex justify-end gap-4 pt-4">
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
              {isLoading ? 'Saving...' : editingActivity ? 'Update' : 'Create'}
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
        <div className="space-y-4">
          {industryTemplates.map((template) => (
            <Card key={template.industry} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {template.activities.map((activity, i) => (
                    <li key={i}>{activity}</li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}
