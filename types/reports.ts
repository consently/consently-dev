/**
 * Types for Reports & Analytics
 */

export interface DateRangeInfo {
  start: string;
  end: string;
  days: string;
}

export interface SummaryMetrics {
  totalConsents: number;
  grantedConsents: number;
  deniedConsents: number;
  withdrawnConsents: number;
  consentRate: number;
}

export interface TrendDataPoint {
  date: string;
  granted: number;
  denied: number;
  withdrawn: number;
}

export interface DeviceData {
  name: string;
  value: number;
  percentage: string;
}

export interface GeographicData {
  country: string;
  consents: number;
  consentRate: number;
}

export interface AnalyticsReport {
  generatedAt: string;
  dateRange: DateRangeInfo;
  summary: SummaryMetrics;
  trendData: TrendDataPoint[];
  deviceData: DeviceData[];
  geographicData: GeographicData[];
}

export type ExportFormat = 'pdf' | 'csv' | 'json';
export type DateRangeOption = '7' | '30' | '90' | 'all';

export interface ReportsFilters {
  dateRange: DateRangeOption;
  exportFormat: ExportFormat;
}

export interface PreviousPeriodComparison {
  totalConsents: number;
  consentRate: number;
  totalCountries: number;
}
