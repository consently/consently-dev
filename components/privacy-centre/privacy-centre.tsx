'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { PreferenceCentre } from './preference-centre';
import { RequestCentre } from './request-centre';
import { Shield, FileText } from 'lucide-react';

interface PrivacyCentreProps {
  visitorId: string;
  widgetId: string;
}

export function PrivacyCentre({ visitorId, widgetId }: PrivacyCentreProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Centre</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your consent preferences and exercise your data protection rights under the DPDP Act 2023
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="p-6 shadow-lg">
          <Tabs defaultValue="preferences" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Preference Centre
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Request Centre
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preferences">
              <PreferenceCentre visitorId={visitorId} widgetId={widgetId} />
            </TabsContent>

            <TabsContent value="requests">
              <RequestCentre visitorId={visitorId} widgetId={widgetId} />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Your privacy is important to us. For questions or concerns, please contact our Data Protection Officer.
          </p>
          <p className="mt-2">
            Protected under the{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Digital Personal Data Protection Act, 2023
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
