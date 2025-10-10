'use client';

import { useState } from 'react';
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
  name: string;
  description: string;
  legalBasis: string;
  dataCategories: string[];
  retentionPeriod: string;
  createdAt: string;
}

const mockActivities: ProcessingActivity[] = [
  {
    id: '1',
    name: 'User Registration',
    description: 'Processing of user registration data including email, name, and company information',
    legalBasis: 'contract',
    dataCategories: ['Email', 'Name', 'Company Name'],
    retentionPeriod: '5 years',
    createdAt: '2025-10-01',
  },
  {
    id: '2',
    name: 'Payment Processing',
    description: 'Processing of payment and billing information for subscription management',
    legalBasis: 'contract',
    dataCategories: ['Payment Info', 'Billing Address'],
    retentionPeriod: '7 years',
    createdAt: '2025-10-01',
  },
  {
    id: '3',
    name: 'Analytics and Reporting',
    description: 'Collection and analysis of usage data for improving service quality',
    legalBasis: 'legitimate-interest',
    dataCategories: ['Usage Data', 'Device Info', 'IP Address'],
    retentionPeriod: '2 years',
    createdAt: '2025-10-01',
  },
];

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
  const [activities, setActivities] = useState<ProcessingActivity[]>(mockActivities);
  const [modalOpen, setModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ProcessingActivity | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProcessingActivityInput>({
    resolver: zodResolver(processingActivitySchema),
  });

  const onSubmit = async (data: ProcessingActivityInput) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (editingActivity) {
        setActivities(activities.map(a => 
          a.id === editingActivity.id 
            ? { ...a, ...data, dataCategories: data.dataCategories }
            : a
        ));
        toast.success('Activity updated successfully');
      } else {
        const newActivity: ProcessingActivity = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        setActivities([...activities, newActivity]);
        toast.success('Activity created successfully');
      }
      
      setModalOpen(false);
      setEditingActivity(null);
      reset();
    } catch (error) {
      toast.error('Failed to save activity');
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
      setActivities(activities.filter(a => a.id !== id));
      toast.success('Activity deleted successfully');
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
  };

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
            <CardTitle className="text-sm font-medium text-gray-600">Consent-Based</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.legalBasis === 'consent').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Contract-Based</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.legalBasis === 'contract').length}
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
                    <h3 className="text-lg font-semibold text-gray-900">{activity.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{activity.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Legal Basis</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {legalBasisLabels[activity.legalBasis]}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Data Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {activity.dataCategories.slice(0, 2).map((cat, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {cat}
                          </span>
                        ))}
                        {activity.dataCategories.length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            +{activity.dataCategories.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Retention Period</p>
                      <p className="text-sm font-medium text-gray-900">{activity.retentionPeriod}</p>
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
            defaultValue={editingActivity?.name}
            required
          />

          <Textarea
            {...register('description')}
            label="Description"
            placeholder="Describe the data processing activity..."
            error={errors.description?.message}
            defaultValue={editingActivity?.description}
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
            defaultValue={editingActivity?.legalBasis}
            required
          />

          <Input
            {...register('dataCategories')}
            label="Data Categories"
            placeholder="Email, Name, Phone (comma separated)"
            helperText="Enter data categories separated by commas"
            error={errors.dataCategories?.message}
            defaultValue={editingActivity?.dataCategories.join(', ')}
            required
          />

          <Input
            {...register('retentionPeriod')}
            label="Retention Period"
            placeholder="e.g., 2 years, 90 days"
            error={errors.retentionPeriod?.message}
            defaultValue={editingActivity?.retentionPeriod}
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
