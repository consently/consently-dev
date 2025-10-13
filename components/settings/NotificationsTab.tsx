import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Save, Loader2 } from 'lucide-react';

export function NotificationsTab() {
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    consentGranted: true,
    consentWithdrawn: true,
    weeklyReport: true,
    securityAlerts: true,
    productUpdates: false,
    marketingEmails: false,
  });

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Integrate with API when notification preferences endpoint is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const notificationItems = [
    {
      key: 'consentGranted' as const,
      label: 'New consent granted',
      description: 'Receive notifications when users grant consent',
    },
    {
      key: 'consentWithdrawn' as const,
      label: 'Consent withdrawn',
      description: 'Get notified when users withdraw their consent',
    },
    {
      key: 'weeklyReport' as const,
      label: 'Weekly summary report',
      description: 'Receive a weekly summary of consent activities',
    },
    {
      key: 'securityAlerts' as const,
      label: 'Security alerts',
      description: 'Important security updates and alerts',
    },
    {
      key: 'productUpdates' as const,
      label: 'Product updates',
      description: 'News about new features and improvements',
    },
    {
      key: 'marketingEmails' as const,
      label: 'Marketing emails',
      description: 'Tips, best practices, and special offers',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>Choose what emails you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationItems.map((item) => (
            <div key={item.key} className="flex items-start justify-between py-3 border-b last:border-0">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={preferences[item.key]}
                  onChange={() => handleToggle(item.key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
