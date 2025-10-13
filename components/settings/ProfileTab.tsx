import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import type { UserProfileData } from '@/types/settings';

interface ProfileTabProps {
  data: UserProfileData;
  onUpdate: (data: { full_name?: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>;
  updating: boolean;
}

const profileFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

type ProfileFormInput = z.infer<typeof profileFormSchema>;

export function ProfileTab({ data, onUpdate, updating }: ProfileTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: data.profile.full_name || '',
      email: data.auth.email,
      companyName: data.profile.company_name || '',
      phone: data.profile.phone || '',
      website: data.profile.website || '',
    },
  });

  const onSubmit = async (formData: ProfileFormInput) => {
    try {
      const result = await onUpdate({
        full_name: formData.fullName,
      });

      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
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
                disabled={updating}
                required
              />
              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="john@company.com"
                error={errors.email?.message}
                disabled
                readOnly
                helperText="Email cannot be changed here"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('companyName')}
                label="Company Name"
                placeholder="Your Company Inc."
                error={errors.companyName?.message}
                disabled={updating}
                helperText="Read-only (set during onboarding)"
                readOnly
              />
              <Input
                {...register('phone')}
                type="tel"
                label="Phone Number"
                placeholder="+91 98765 43210"
                error={errors.phone?.message}
                disabled={updating}
                helperText="Optional"
              />
            </div>

            <Input
              {...register('website')}
              type="url"
              label="Website"
              placeholder="https://yourcompany.com"
              error={errors.website?.message}
              disabled={updating}
              helperText="Optional"
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updating || !isDirty}>
                {updating ? (
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

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>View your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Account Created</span>
            <span className="text-sm text-gray-900">
              {new Date(data.profile.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Email Verified</span>
            <span className={`text-sm font-medium ${data.auth.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
              {data.auth.emailVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium text-gray-600">Last Sign In</span>
            <span className="text-sm text-gray-900">
              {data.auth.lastSignIn ? new Date(data.auth.lastSignIn).toLocaleString() : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
