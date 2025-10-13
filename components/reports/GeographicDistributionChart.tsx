import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GeographicData } from '@/types/reports';

interface GeographicDistributionChartProps {
  data: GeographicData[];
}

export function GeographicDistributionChart({ data }: GeographicDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Geographic Distribution</CardTitle>
        <CardDescription>Top countries by consent volume</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No geographic data available
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((geo) => (
              <div key={geo.country}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{geo.country}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{geo.consents.toLocaleString()}</span>
                    <span className="text-xs text-gray-600 ml-2">({geo.consentRate}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${geo.consentRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
