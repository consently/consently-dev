'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { profileSchema, changePasswordSchema, type ProfileInput, type ChangePasswordInput } from '@/lib/schemas';
import { useUserStore } from '@/lib/stores/useUserStore';
import { toast } from 'sonner';
import { User, Lock, Bell, CreditCard, Shield, Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUserStore();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && <ProfileTab user={user} isLoading={isLoading} setIsLoading={setIsLoading} />}
        {activeTab === 'security' && <SecurityTab isLoading={isLoading} setIsLoading={setIsLoading} />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'billing' && <BillingTab />}
      </div>
    </div>
  );
}

function ProfileTab({ user, isLoading, setIsLoading }: any) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      companyName: user?.companyName || '',
      phone: user?.phone || '',
      website: user?.website || '',
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal and company information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('fullName')}
                label="Full Name"
                placeholder="John Doe"
                error={errors.fullName?.message}
                disabled={isLoading}
                required
              />
              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="john@company.com"
                error={errors.email?.message}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('companyName')}
                label="Company Name"
                placeholder="Your Company Inc."
                error={errors.companyName?.message}
                disabled={isLoading}
                required
              />
              <Input
                {...register('phone')}
                type="tel"
                label="Phone Number"
                placeholder="+91 98765 43210"
                error={errors.phone?.message}
                disabled={isLoading}
              />
            </div>

            <Input
              {...register('website')}
              type="url"
              label="Website"
              placeholder="https://yourcompany.com"
              error={errors.website?.message}
              disabled={isLoading}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityTab({ isLoading, setIsLoading }: any) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Password changed successfully');
      reset();
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('currentPassword')}
              type="password"
              label="Current Password"
              placeholder="••••••••"
              error={errors.currentPassword?.message}
              disabled={isLoading}
              required
            />

            <Input
              {...register('newPassword')}
              type="password"
              label="New Password"
              placeholder="••••••••"
              helperText="Minimum 8 characters"
              error={errors.newPassword?.message}
              disabled={isLoading}
              required
            />

            <Input
              {...register('confirmPassword')}
              type="password"
              label="Confirm New Password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              required
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">2FA Status</p>
              <p className="text-sm text-gray-600">Currently disabled</p>
            </div>
            <Button variant="outline">Enable 2FA</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose what emails you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: 'consent-granted', label: 'New consent granted', description: 'Receive notifications when users grant consent' },
            { id: 'consent-withdrawn', label: 'Consent withdrawn', description: 'Get notified when users withdraw their consent' },
            { id: 'weekly-report', label: 'Weekly summary report', description: 'Receive a weekly summary of consent activities' },
            { id: 'security-alerts', label: 'Security alerts', description: 'Important security updates and alerts' },
          ].map((item) => (
            <div key={item.id} className="flex items-start justify-between py-3 border-b last:border-0">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-semibold text-lg text-gray-900">Medium Plan</p>
                <p className="text-gray-600">Up to 100,000 consents/month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">₹2,499</p>
                <p className="text-sm text-gray-600">/month</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline">Change Plan</Button>
              <Button variant="outline">Cancel Subscription</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2025-10-01', amount: '₹2,499', status: 'Paid' },
              { date: '2025-09-01', amount: '₹2,499', status: 'Paid' },
              { date: '2025-08-01', amount: '₹2,499', status: 'Paid' },
            ].map((invoice, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{invoice.date}</p>
                  <p className="text-sm text-gray-600">{invoice.amount}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {invoice.status}
                  </span>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
