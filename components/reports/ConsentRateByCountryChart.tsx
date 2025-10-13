import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { GeographicData } from '@/types/reports';

interface ConsentRateByCountryChartProps {
  data: GeographicData[];
}

export function ConsentRateByCountryChart({ data }: ConsentRateByCountryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent Rate by Country</CardTitle>
        <CardDescription>Compare consent acceptance rates across regions</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No data available for comparison
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="country" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
              <Bar dataKey="consentRate" fill="#3b82f6" name="Consent Rate %" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
