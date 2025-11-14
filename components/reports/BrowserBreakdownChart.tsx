'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { BrowserData } from '@/types/reports';
import { Globe } from 'lucide-react';

interface BrowserBreakdownChartProps {
  data: BrowserData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function BrowserBreakdownChart({ data }: BrowserBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle>Browser Breakdown</CardTitle>
          </div>
          <CardDescription>No browser data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    browser: item.name,
    count: item.count,
    percentage: item.percentage,
    consentRate: item.consentRate,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <CardTitle>Browser Breakdown</CardTitle>
        </div>
        <CardDescription>
          Consent distribution by browser type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="browser" type="category" tick={{ fontSize: 12 }} width={80} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'consentRate') return `${value}%`;
                return value.toLocaleString();
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-semibold">{data.browser}</p>
                      <p className="text-sm text-gray-600">Count: {data.count.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
                      <p className="text-sm text-green-600">Consent Rate: {data.consentRate}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" name="Consents">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

