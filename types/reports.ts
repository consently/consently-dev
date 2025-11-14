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
  partialConsents: number;
  consentRate: number;
  denialRate: number;
  revocationRate: number;
  uniqueVisitors: number;
  returnVisitors: number;
  averageConsentDuration?: number;
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

export interface HourlyData {
  hour: number;
  consents: number;
  granted: number;
  denied: number;
}

export interface DayOfWeekData {
  day: string;
  dayNumber: number;
  consents: number;
  granted: number;
  denied: number;
}

export interface BrowserData {
  name: string;
  count: number;
  percentage: number;
  consentRate: number;
}

export interface OSData {
  name: string;
  count: number;
  percentage: number;
  consentRate: number;
}

export interface LanguageData {
  language: string;
  count: number;
  percentage: number;
  consentRate: number;
}

export interface ConversionFunnel {
  visitors: number;
  consents: number;
  granted: number;
  partial: number;
  conversionRate: number;
}

export interface PreviousPeriodComparison {
  totalConsents: number;
  consentRate: number;
  change: number;
  changePercentage: number;
}

export interface AnalyticsReport {
  generatedAt: string;
  dateRange: DateRangeInfo;
  summary: SummaryMetrics;
  trendData: TrendDataPoint[];
  deviceData: DeviceData[];
  geographicData: GeographicData[];
  hourlyData: HourlyData[];
  dayOfWeekData: DayOfWeekData[];
  browserData: BrowserData[];
  osData: OSData[];
  languageData: LanguageData[];
  conversionFunnel: ConversionFunnel;
  previousPeriod?: PreviousPeriodComparison;
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
