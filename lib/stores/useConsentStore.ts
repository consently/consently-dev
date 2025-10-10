import { create } from 'zustand';
import { ConsentRecord } from '@/types/api.types';

interface ConsentStore {
  consents: ConsentRecord[];
  selectedConsent: ConsentRecord | null;
  setConsents: (consents: ConsentRecord[]) => void;
  addConsent: (consent: ConsentRecord) => void;
  updateConsent: (id: string, updates: Partial<ConsentRecord>) => void;
  deleteConsent: (id: string) => void;
  setSelectedConsent: (consent: ConsentRecord | null) => void;
}

export const useConsentStore = create<ConsentStore>((set) => ({
  consents: [],
  selectedConsent: null,
  setConsents: (consents) => set({ consents }),
  addConsent: (consent) => set((state) => ({ consents: [...state.consents, consent] })),
  updateConsent: (id, updates) =>
    set((state) => ({
      consents: state.consents.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  deleteConsent: (id) =>
    set((state) => ({
      consents: state.consents.filter((c) => c.id !== id),
    })),
  setSelectedConsent: (consent) => set({ selectedConsent: consent }),
}));
