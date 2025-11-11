'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { PreferenceCentre } from './preference-centre';
import { RequestCentre } from './request-centre';
import { PagesView } from './pages-view';
import { Shield, FileText, Globe } from 'lucide-react';

interface PrivacyCentreProps {
  visitorId: string;
  widgetId: string;
}

export function PrivacyCentre({ visitorId, widgetId }: PrivacyCentreProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-full bg-blue-100 mb-3 md:mb-4">
            <Shield className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">Privacy Centre</h1>
          <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Manage your consent preferences and exercise your data protection rights under the DPDP Act 2023
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="p-3 md:p-6 shadow-lg">
          <Tabs defaultValue="preferences" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 h-auto">
              <TabsTrigger value="preferences" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 px-1">
                <Shield className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Preference Centre</span>
                <span className="sm:hidden">Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="pages" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 px-1">
                <Globe className="h-3 w-3 md:h-4 md:w-4" />
                Pages
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 px-1">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Request Centre</span>
                <span className="sm:hidden">Requests</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preferences">
              <PreferenceCentre visitorId={visitorId} widgetId={widgetId} />
            </TabsContent>

            <TabsContent value="pages">
              <PagesView visitorId={visitorId} widgetId={widgetId} />
            </TabsContent>

            <TabsContent value="requests">
              <RequestCentre visitorId={visitorId} widgetId={widgetId} />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-gray-500 px-2">
          <p className="leading-relaxed">
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
