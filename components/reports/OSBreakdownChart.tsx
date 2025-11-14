'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { OSData } from '@/types/reports';
import { Monitor } from 'lucide-react';

interface OSBreakdownChartProps {
  data: OSData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function OSBreakdownChart({ data }: OSBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-indigo-600" />
            <CardTitle>Operating System Breakdown</CardTitle>
          </div>
          <CardDescription>No OS data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    name: item.name,
    value: item.count,
    percentage: item.percentage,
    consentRate: item.consentRate,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-indigo-600" />
          <CardTitle>Operating System Breakdown</CardTitle>
        </div>
        <CardDescription>
          Consent distribution by operating system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string, props: any) => {
                if (name === 'value') {
                  return [
                    `${value.toLocaleString()} (${props.payload.percentage}%)`,
                    'Consents'
                  ];
                }
                return value;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

