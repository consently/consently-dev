import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { TrendDataPoint } from '@/types/reports';

interface ConsentTrendsChartProps {
  data: TrendDataPoint[];
}

export function ConsentTrendsChart({ data }: ConsentTrendsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent Trends Over Time</CardTitle>
        <CardDescription>Track consent activities over the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-gray-500">
            No trend data available for the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#888" 
                fontSize={12}
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="granted" 
                stroke="#10b981" 
                strokeWidth={2} 
                name="Granted" 
              />
              <Line 
                type="monotone" 
                dataKey="denied" 
                stroke="#ef4444" 
                strokeWidth={2} 
                name="Denied" 
              />
              <Line 
                type="monotone" 
                dataKey="withdrawn" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                name="Withdrawn" 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
