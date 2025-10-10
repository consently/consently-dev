import { create } from 'zustand';
import { BannerTemplate } from '@/types/api.types';

interface WidgetSettings {
  language: string;
  position: 'top' | 'bottom' | 'center';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  showDeclineButton: boolean;
  showSettingsLink: boolean;
}

interface WidgetStore {
  settings: WidgetSettings;
  template: BannerTemplate | null;
  updateSettings: (settings: Partial<WidgetSettings>) => void;
  setTemplate: (template: BannerTemplate | null) => void;
  resetSettings: () => void;
}

const defaultSettings: WidgetSettings = {
  language: 'en',
  position: 'bottom',
  primaryColor: '#2563eb',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  showDeclineButton: true,
  showSettingsLink: true,
};

export const useWidgetStore = create<WidgetStore>((set) => ({
  settings: defaultSettings,
  template: null,
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  setTemplate: (template) => set({ template }),
  resetSettings: () => set({ settings: defaultSettings }),
}));
