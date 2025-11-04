'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import {
  FileSearch,
  Edit3,
  Trash2,
  MessageSquare,
  UserPlus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface RightsRequest {
  id: string;
  requestType: 'access' | 'correction' | 'erasure' | 'grievance' | 'nomination';
  requestTitle: string;
  requestDescription: string;
  status: 'pending' | 'under_review' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  responseMessage: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  completedAt: string | null;
  isVerified: boolean;
}

interface RequestCentreProps {
  visitorId: string;
  widgetId: string;
}

const RIGHTS_INFO = [
  {
    type: 'access',
    icon: FileSearch,
    title: 'Right to Access',
    description: 'Obtain a summary of your personal data being processed',
    section: 'Section 11 - DPDP Act 2023',
    color: 'blue',
  },
  {
    type: 'correction',
    icon: Edit3,
    title: 'Right to Correction',
    description: 'Request correction of inaccurate or misleading personal data',
    section: 'Section 11 - DPDP Act 2023',
    color: 'amber',
  },
  {
    type: 'erasure',
    icon: Trash2,
    title: 'Right to Erasure',
    description: 'Request deletion of your personal data',
    section: 'Section 11 - DPDP Act 2023',
    color: 'red',
  },
  {
    type: 'grievance',
    icon: MessageSquare,
    title: 'Right to Grievance Redressal',
    description: 'File complaints about data processing practices',
    section: 'Section 14 - DPDP Act 2023',
    color: 'purple',
  },
  {
    type: 'nomination',
    icon: UserPlus,
    title: 'Right to Nominate',
    description: 'Appoint a representative to exercise your rights',
    section: 'Section 15 - DPDP Act 2023',
    color: 'green',
  },
];

export function RequestCentre({ visitorId, widgetId }: RequestCentreProps) {
  const [requests, setRequests] = useState<RightsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRightType, setSelectedRightType] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [visitorId, widgetId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/privacy-centre/rights-requests?visitorId=${visitorId}&widgetId=${widgetId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequestModal = (rightType: string) => {
    setSelectedRightType(rightType);
    const rightInfo = RIGHTS_INFO.find((r) => r.type === rightType);
    setRequestTitle(`Request for ${rightInfo?.title || rightType}`);
    setShowRequestModal(true);
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    setSelectedRightType(null);
    setEmail('');
    setName('');
    setPhone('');
    setRequestTitle('');
    setRequestDescription('');
  };

  const handleSubmitRequest = async () => {
    if (!email || !requestTitle || !requestDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/privacy-centre/rights-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          widgetId,
          visitorEmail: email,
          visitorName: name || undefined,
          visitorPhone: phone || undefined,
          requestType: selectedRightType,
          requestTitle,
          requestDescription,
          metadata: {
            userAgent: navigator.userAgent,
            language: navigator.language,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      const data = await response.json();
      
      toast.success('Request submitted successfully! Check your email for verification.');
      
      // Show verification code in development
      if (data.data.verificationCode) {
        toast.info(`Verification code (dev only): ${data.data.verificationCode}`);
      }

      handleCloseRequestModal();
      await fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: RightsRequest['status']) => {
    const config = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      in_progress: { color: 'bg-amber-100 text-amber-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const { color, icon: Icon } = config[status];

    return (
      <Badge className={`${color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getRightInfo = (type: string) => {
    return RIGHTS_INFO.find((r) => r.type === type);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Data Subject Rights</h2>
        <p className="text-gray-600 mt-2">
          Exercise your rights under the Digital Personal Data Protection Act (DPDP) 2023
        </p>
      </div>

      {/* Rights Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {RIGHTS_INFO.map((right) => {
          const Icon = right.icon;
          return (
            <Card
              key={right.type}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500"
              onClick={() => handleOpenRequestModal(right.type)}
            >
              <CardHeader>
                <div className={`h-12 w-12 rounded-lg bg-${right.color}-100 flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 text-${right.color}-600`} />
                </div>
                <CardTitle className="text-lg">{right.title}</CardTitle>
                <CardDescription className="text-sm">{right.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">{right.section}</p>
                <Button size="sm" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Raise Request
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Tracker */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">My Requests</h3>
          <Button variant="outline" size="sm" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't submitted any rights requests. Click on any of the cards above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const rightInfo = getRightInfo(request.requestType);
              const Icon = rightInfo?.icon || MessageSquare;

              return (
                <Card key={request.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg">{request.requestTitle}</CardTitle>
                          <CardDescription className="mt-1">
                            {rightInfo?.title || request.requestType}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-4">{request.requestDescription}</p>

                    {/* Response */}
                    {request.responseMessage && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-blue-900 mb-1">Response:</p>
                        <p className="text-sm text-blue-800">{request.responseMessage}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {request.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{request.rejectionReason}</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Submitted: {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                      {request.dueDate && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Due: {new Date(request.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {request.completedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed: {new Date(request.completedAt).toLocaleDateString()}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 ${request.isVerified ? 'text-green-600' : 'text-amber-600'}`}>
                        {request.isVerified ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {request.isVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Modal */}
      <Modal isOpen={showRequestModal} onClose={handleCloseRequestModal} title={`Submit ${getRightInfo(selectedRightType || '')?.title || 'Request'}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {getRightInfo(selectedRightType || '')?.description}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">We'll send verification and updates to this email</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name (Optional)</label>
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
              <Input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Brief title for your request"
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Details <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Please provide details about your request..."
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              rows={5}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Be as specific as possible to help us process your request efficiently
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCloseRequestModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
