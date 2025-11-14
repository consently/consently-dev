'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConversionFunnel } from '@/types/reports';
import { TrendingUp } from 'lucide-react';

interface ConversionFunnelChartProps {
  data: ConversionFunnel;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const funnelData = [
    { name: 'Visitors', value: data.visitors, fill: COLORS[0] },
    { name: 'Consents', value: data.consents, fill: COLORS[1] },
    { name: 'Granted', value: data.granted, fill: COLORS[2] },
    { name: 'Partial', value: data.partial, fill: COLORS[3] },
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <CardTitle>Conversion Funnel</CardTitle>
        </div>
        <CardDescription>
          Visitor to consent conversion flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.visitors.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Visitors</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.consents.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Consents</div>
              <div className="text-xs text-gray-500 mt-1">
                {data.visitors > 0 ? ((data.consents / data.visitors) * 100).toFixed(1) : 0}% conversion
              </div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{data.granted.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Granted</div>
              <div className="text-xs text-gray-500 mt-1">
                {data.consents > 0 ? ((data.granted / data.consents) * 100).toFixed(1) : 0}% of consents
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{data.partial.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Partial</div>
              <div className="text-xs text-gray-500 mt-1">
                {data.consents > 0 ? ((data.partial / data.consents) * 100).toFixed(1) : 0}% of consents
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Conversion Rate</span>
              <span className="text-lg font-bold text-green-600">{data.conversionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(data.conversionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

