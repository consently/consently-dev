'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { HourlyData } from '@/types/reports';
import { Clock } from 'lucide-react';

interface HourlyPatternChartProps {
  data: HourlyData[];
}

export function HourlyPatternChart({ data }: HourlyPatternChartProps) {
  const chartData = data.map(item => ({
    hour: `${item.hour}:00`,
    hourNum: item.hour,
    Consents: item.consents,
    Granted: item.granted,
    Denied: item.denied,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <CardTitle>Hourly Consent Patterns</CardTitle>
        </div>
        <CardDescription>
          Consent activity throughout the day (24-hour format)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Consents" fill="#3b82f6" name="Total Consents" />
            <Bar dataKey="Granted" fill="#10b981" name="Granted" />
            <Bar dataKey="Denied" fill="#ef4444" name="Denied" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

