import { create } from 'zustand';

interface DateRange {
  start: Date;
  end: Date;
}

interface DashboardStore {
  dateRange: DateRange;
  selectedMetric: 'all' | 'granted' | 'denied' | 'withdrawn';
  searchQuery: string;
  setDateRange: (range: DateRange) => void;
  setSelectedMetric: (metric: 'all' | 'granted' | 'denied' | 'withdrawn') => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const defaultDateRange: DateRange = {
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  end: new Date(),
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  dateRange: defaultDateRange,
  selectedMetric: 'all',
  searchQuery: '',
  setDateRange: (range) => set({ dateRange: range }),
  setSelectedMetric: (metric) => set({ selectedMetric: metric }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () =>
    set({
      dateRange: defaultDateRange,
      selectedMetric: 'all',
      searchQuery: '',
    }),
}));
