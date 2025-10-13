import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { AnalyticsReport, DateRangeOption } from '@/types/reports';

interface UseReportsAnalyticsReturn {
  data: AnalyticsReport | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage reports analytics data
 * @param dateRange - The date range filter for the analytics data
 */
export function useReportsAnalytics(dateRange: DateRangeOption): UseReportsAnalyticsReturn {
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.reports.getAnalytics({
        dateRange,
        format: 'json',
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // The API returns the report data directly (not wrapped in a 'data' property)
      // Check if response has the expected report structure
      const responseData = response as any;
      
      if (responseData && (responseData.summary || responseData.generatedAt)) {
        setData(responseData as AnalyticsReport);
      } else if (response.data) {
        // Fallback: check if it's wrapped in a 'data' property
        setData(response.data);
      } else {
        throw new Error('No data received from API');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(errorMessage);
      console.error('Error fetching reports analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
