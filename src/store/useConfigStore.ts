import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ConfigStore {
  isFullscreen: boolean;
  theme: Theme;

  setFullscreen: (value: boolean) => void;
  toggleFullscreen: () => void;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const useConfigStore = create<ConfigStore>((set, get) => ({
  isFullscreen: false,
  theme: "system",
  language: "pt-BR",

  setFullscreen: (value) => set({ isFullscreen: value }),

  toggleFullscreen: () =>
    set((state) => ({ isFullscreen: !state.isFullscreen })),

  setTheme: (theme) => set({ theme }),

  toggleTheme: () => {
    const current = get().theme;
    const next = current === "light" ? "dark" : "light";
    set({ theme: next });
  },
}));

export default useConfigStore;
