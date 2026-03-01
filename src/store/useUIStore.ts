import { create } from 'zustand';

export interface useUIStore {
  loading: boolean;
  error: string | null;
  setLoading: (value: boolean) => void;
  setError: (msg: string | null) => void;

  controlFetching: (value?: boolean, error?: string | null) => void;

  clearError: () => void;
  clearLoading: () => void;
}

export const useUIStore = create<useUIStore>((set, get, store) => ({
  loading: false,

  error: null,

  setLoading: (value: boolean) => set({ loading: value }),

  setError: (msg: string | null) => set({ error: msg }),

  controlFetching: (value?: boolean, msg?: string | null) => {
    set({ loading: value, error: msg });
  },

  clearError: () => set({ error: store.getInitialState().error }),

  clearLoading() {
    set({ loading: store.getInitialState().loading });
  },
}));
