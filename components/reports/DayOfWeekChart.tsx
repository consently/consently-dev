'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DayOfWeekData } from '@/types/reports';
import { Calendar } from 'lucide-react';

interface DayOfWeekChartProps {
  data: DayOfWeekData[];
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const chartData = data.map(item => ({
    day: item.day.substring(0, 3), // Short form: Mon, Tue, etc.
    fullDay: item.day,
    Consents: item.consents,
    Granted: item.granted,
    Denied: item.denied,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          <CardTitle>Day of Week Patterns</CardTitle>
        </div>
        <CardDescription>
          Consent activity by day of the week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number) => value.toLocaleString()}
              labelFormatter={(label) => `Day: ${data.find(d => d.day.substring(0, 3) === label)?.day || label}`}
            />
            <Legend />
            <Bar dataKey="Consents" fill="#8b5cf6" name="Total Consents" />
            <Bar dataKey="Granted" fill="#10b981" name="Granted" />
            <Bar dataKey="Denied" fill="#ef4444" name="Denied" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

