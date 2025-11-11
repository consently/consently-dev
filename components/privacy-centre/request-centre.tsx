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
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-3/4"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl animate-pulse shadow-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      {/* Modern Header with Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl"></div>
        <div className="relative bg-gradient-to-br from-white to-blue-50/50 border border-blue-100 rounded-2xl p-6 md:p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center shadow-lg flex-shrink-0">
              <MessageSquare className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
                Data Subject Rights
              </h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Exercise your rights under the Digital Personal Data Protection Act (DPDP) 2023. 
                Request access, correction, erasure, or file grievances about your personal data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rights Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {RIGHTS_INFO.map((right) => {
          const Icon = right.icon;
          const colorClasses = {
            blue: 'from-blue-50 via-indigo-50 to-purple-50 border-blue-200 hover:border-blue-400',
            amber: 'from-amber-50 via-yellow-50 to-orange-50 border-amber-200 hover:border-amber-400',
            red: 'from-red-50 via-pink-50 to-rose-50 border-red-200 hover:border-red-400',
            purple: 'from-purple-50 via-violet-50 to-fuchsia-50 border-purple-200 hover:border-purple-400',
            green: 'from-green-50 via-emerald-50 to-teal-50 border-green-200 hover:border-green-400',
          };
          const iconColorClasses = {
            blue: 'from-blue-500 to-indigo-600',
            amber: 'from-amber-500 to-orange-600',
            red: 'from-red-500 to-pink-600',
            purple: 'from-purple-500 to-violet-600',
            green: 'from-green-500 to-emerald-600',
          };
          return (
            <Card
              key={right.type}
              className={`hover:shadow-xl transition-all duration-300 cursor-pointer border-2 bg-gradient-to-br ${colorClasses[right.color as keyof typeof colorClasses]} overflow-hidden group`}
              onClick={() => handleOpenRequestModal(right.type)}
            >
              <CardHeader className="pb-4">
                <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br ${iconColorClasses[right.color as keyof typeof iconColorClasses]} flex items-center justify-center mb-3 md:mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold text-gray-900 mb-2">{right.title}</CardTitle>
                <CardDescription className="text-xs md:text-sm text-gray-600 leading-relaxed">{right.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-500 mb-4 font-medium">{right.section}</p>
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Raise Request
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Tracker */}
      <div className="mt-6 md:mt-8">
        {/* Action Bar */}
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">My Requests</h3>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Track the status of your data subject rights requests
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRequests} className="flex-shrink-0">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {requests.length === 0 ? (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
            <CardContent className="py-16 md:py-20 text-center">
              <div className="inline-flex h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-blue-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No Requests Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm md:text-base">
                You haven't submitted any rights requests. Click on any of the cards above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {requests.map((request) => {
              const rightInfo = getRightInfo(request.requestType);
              const Icon = rightInfo?.icon || MessageSquare;
              const isCompleted = request.status === 'completed';
              const isRejected = request.status === 'rejected';

              return (
                <Card 
                  key={request.id} 
                  className={`border-0 shadow-lg transition-all duration-300 overflow-hidden ${
                    isCompleted
                      ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 ring-2 ring-green-200'
                      : isRejected
                      ? 'bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 ring-2 ring-red-200'
                      : 'bg-gradient-to-br from-white to-gray-50 hover:from-blue-50/30'
                  }`}
                >
                  <CardHeader className="pb-4 md:pb-5">
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br ${
                          isCompleted 
                            ? 'from-green-500 to-emerald-600' 
                            : isRejected
                            ? 'from-red-500 to-pink-600'
                            : 'from-blue-500 to-indigo-600'
                        } flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2 flex-wrap">
                            <CardTitle className="text-base md:text-xl font-bold text-gray-900 line-clamp-2 flex-1">
                              {request.requestTitle}
                            </CardTitle>
                            <div className="flex-shrink-0">
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                          <CardDescription className="text-xs md:text-sm text-gray-600">
                            {rightInfo?.title || request.requestType}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="border-t border-gray-200/50 bg-white/50 backdrop-blur-sm pt-5 md:pt-6">
                    <div className="space-y-4 md:space-y-5">
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">{request.requestDescription}</p>

                      {/* Response */}
                      {request.responseMessage && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 md:p-5">
                          <div className="flex items-start gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm md:text-base font-bold text-blue-900">Response:</p>
                          </div>
                          <p className="text-sm md:text-base text-blue-800 leading-relaxed ml-7">{request.responseMessage}</p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {request.rejectionReason && (
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 md:p-5">
                          <div className="flex items-start gap-2 mb-2">
                            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm md:text-base font-bold text-red-900">Rejection Reason:</p>
                          </div>
                          <p className="text-sm md:text-base text-red-800 leading-relaxed ml-7">{request.rejectionReason}</p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium">Submitted:</span>
                            <span className="text-gray-700">{new Date(request.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          {request.dueDate && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              <span className="font-medium">Due:</span>
                              <span className="text-gray-700">{new Date(request.dueDate).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                          )}
                          {request.completedAt && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="font-medium">Completed:</span>
                              <span className="text-gray-700">{new Date(request.completedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                          )}
                          <div className={`flex items-center gap-2 ${request.isVerified ? 'text-green-600' : 'text-amber-600'}`}>
                            {request.isVerified ? (
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            )}
                            <span className="font-medium">
                              {request.isVerified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </div>
                        </div>
                      </div>
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
        <div className="space-y-5 md:space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              {getRightInfo(selectedRightType || '')?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-900 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-sm md:text-base"
            />
            <p className="text-xs md:text-sm text-gray-500 mt-2">We'll send verification and updates to this email</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-900 mb-2">Name (Optional)</label>
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm md:text-base"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-semibold text-gray-900 mb-2">Phone (Optional)</label>
              <Input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-900 mb-2">
              Request Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Brief title for your request"
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              required
              className="text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-900 mb-2">
              Request Details <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Please provide details about your request..."
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              rows={6}
              required
              className="text-sm md:text-base"
            />
            <p className="text-xs md:text-sm text-gray-500 mt-2">
              Be as specific as possible to help us process your request efficiently
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCloseRequestModal} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRequest} 
              disabled={submitting}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
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
