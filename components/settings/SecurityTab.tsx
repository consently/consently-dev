import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/schemas';

interface SecurityTabProps {
  onPasswordUpdate: (newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updating: boolean;
}

export function SecurityTab({ onPasswordUpdate, updating }: SecurityTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      const result = await onPasswordUpdate(data.newPassword);

      if (result.success) {
        toast.success(result.message || 'Password updated successfully');
        reset();
      } else {
        toast.error(result.error || 'Failed to update password');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-600" />
            <CardTitle>Change Password</CardTitle>
          </div>
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
              disabled={updating}
              required
            />

            <Input
              {...register('newPassword')}
              type="password"
              label="New Password"
              placeholder="••••••••"
              helperText="Minimum 8 characters"
              error={errors.newPassword?.message}
              disabled={updating}
              required
            />

            <Input
              {...register('confirmPassword')}
              type="password"
              label="Confirm New Password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              disabled={updating}
              required
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updating}>
                {updating ? (
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
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your active login sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Current Session</p>
                <p className="text-sm text-gray-600">Last activity: Just now</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-500 text-center py-2">
              No other active sessions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
