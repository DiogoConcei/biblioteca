import { create } from 'zustand';

import { AppSettings, BackupMeta } from '@/types/settings.interfaces';

/**
 * Store centralizada de configurações.
 *
 * Por que ela existe:
 * - Antes cada página de settings mantinha um estado local duplicado.
 * - Isso gerava inconsistência visual e risco de sobrescrever valores entre telas.
 * - Agora os componentes usam uma única fonte da verdade via Zustand.
 *
 * Como usar:
 * - Leia estado com `useSettingsStore((state) => state.settings)`.
 * - Atualize com `updateSetting` ou actions específicas (`setBackupTime`, `toggleBackup`).
 * - Chame `loadFromStorage()` ao entrar nas telas de configuração para hidratar dados locais.
 * - Chame `loadFromSystem(systemManager)` para sincronizar com o backend Electron.
 */

const SETTINGS_STORAGE_KEY = 'biblioteca:settings';

export const defaultSettings: AppSettings = {
  backupAuto: false,
  backupSchedule: { frequency: 'weekly', time: '03:00' },
  backupRetention: 10,
  uploadBackupsToDrive: false,
  themeMode: 'system',
  accentColor: '#8963ba',
  compactMode: false,
  sendLogsWithBugReport: false,
  driveConnected: false,
};

type PersistedKeys = keyof AppSettings;

type SettingsGateway = {
  getSettings: () => Promise<AppSettings>;
  setSettings: (partial: Partial<AppSettings>) => Promise<unknown>;
};

type SettingsStore = {
  settings: AppSettings;
  backups: BackupMeta[];
  isLoaded: boolean;
  loadError: string | null;
  saveError: string | null;
  lastSavedAt: number | null;
  setBackups: (backups: BackupMeta[]) => void;
  setBackupTime: (time: string) => void;
  setBackupFrequency: (
    frequency: AppSettings['backupSchedule']['frequency'],
  ) => void;
  toggleBackup: (enabled: boolean) => void;
  updateSetting: <K extends PersistedKeys>(
    key: K,
    value: AppSettings[K],
  ) => void;
  resetSettings: () => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
  saveWithDebounce: () => void;
  loadFromSystem: (gateway: SettingsGateway) => Promise<void>;
  saveToSystem: (
    gateway: SettingsGateway,
    partial: Partial<AppSettings>,
  ) => Promise<void>;
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  backups: [],
  isLoaded: false,
  loadError: null,
  saveError: null,
  lastSavedAt: null,

  setBackups: (backups) => set({ backups }),

  setBackupTime: (time) => {
    const { settings } = get();
    set({
      settings: {
        ...settings,
        backupSchedule: {
          ...settings.backupSchedule,
          time,
        },
      },
    });
    get().saveWithDebounce();
  },

  setBackupFrequency: (frequency) => {
    const { settings } = get();
    set({
      settings: {
        ...settings,
        backupSchedule: {
          ...settings.backupSchedule,
          frequency,
        },
      },
    });
    get().saveWithDebounce();
  },

  toggleBackup: (enabled) => {
    const { settings } = get();
    set({ settings: { ...settings, backupAuto: enabled } });
    get().saveWithDebounce();
  },

  updateSetting: (key, value) => {
    const { settings } = get();
    set({ settings: { ...settings, [key]: value } });
    get().saveWithDebounce();
  },

  resetSettings: () => {
    set({
      settings: defaultSettings,
      loadError: null,
      saveError: null,
      lastSavedAt: Date.now(),
    });
    get().saveToStorage();
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        set({ isLoaded: true });
        return;
      }

      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      set({
        settings: {
          ...defaultSettings,
          ...parsed,
          backupSchedule: {
            ...defaultSettings.backupSchedule,
            ...parsed.backupSchedule,
          },
        },
        isLoaded: true,
        loadError: null,
      });
    } catch {
      set({
        isLoaded: true,
        loadError: 'Não foi possível carregar configurações locais.',
      });
    }
  },

  saveToStorage: () => {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(get().settings),
      );
      set({ saveError: null, lastSavedAt: Date.now() });
    } catch {
      set({ saveError: 'Não foi possível salvar configurações locais.' });
    }
  },

  saveWithDebounce: () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
      get().saveToStorage();
      saveTimer = null;
    }, 250);
  },

  loadFromSystem: async (gateway) => {
    try {
      const loadedSettings = await gateway.getSettings();
      set({
        settings: loadedSettings,
        isLoaded: true,
        loadError: null,
      });
      get().saveToStorage();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Falha ao carregar configurações do sistema';
      set({ loadError: message, isLoaded: true });
    }
  },

  saveToSystem: async (gateway, partial) => {
    const previous = get().settings;
    const next = {
      ...previous,
      ...partial,
      backupSchedule: {
        ...previous.backupSchedule,
        ...(partial.backupSchedule ?? {}),
      },
    };

    set({ settings: next, saveError: null });
    get().saveWithDebounce();

    try {
      await gateway.setSettings(partial);
      set({ lastSavedAt: Date.now() });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar configuração';
      set({ settings: previous, saveError: message });
      get().saveWithDebounce();
      throw error;
    }
  },
}));

export default useSettingsStore;
