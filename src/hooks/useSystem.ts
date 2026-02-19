import { useCallback } from 'react';
import {
  AppSettings,
  BackupMeta,
  CreateBackupOptions,
  ResetApplicationOptions,
  SystemResult,
} from '../types/settings.interfaces';

const DEFAULT_RETRIES = 3;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = DEFAULT_RETRIES,
) => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < retries) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Tempo limite excedido')), 12_000);
        }),
      ]);
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (attempt >= retries) {
        break;
      }

      const backoff = 300 * 2 ** (attempt - 1);
      await delay(backoff);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Erro desconhecido ao executar operação do sistema');
};

export default function useSystemManager() {
  const createBackup = useCallback(async (options?: CreateBackupOptions) => {
    const response = await withRetry<SystemResult>(async () =>
      window.electronAPI.system.createBackup(options),
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao criar backup');
    }

    return response;
  }, []);

  const getBackupList = useCallback(async () => {
    const response = await withRetry<SystemResult<BackupMeta[]>>(async () =>
      window.electronAPI.system.getBackupList(),
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao listar backups');
    }

    return response.data ?? [];
  }, []);

  const restoreBackup = useCallback(async (backupPath: string) => {
    const response = await withRetry<SystemResult>(
      async () =>
        window.electronAPI.system.restoreBackup(
          backupPath,
        ) as Promise<SystemResult>,
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao restaurar backup');
    }

    return response;
  }, []);

  const removeBackup = useCallback(async (backupPath: string) => {
    const response = await withRetry<SystemResult>(
      async () =>
        window.electronAPI.system.removeBackup(
          backupPath,
        ) as Promise<SystemResult>,
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao remover backup');
    }

    return response;
  }, []);

  const getSettings = useCallback(async () => {
    const response = await withRetry<SystemResult<AppSettings>>(
      async () =>
        window.electronAPI.system.getSettings() as Promise<
          SystemResult<AppSettings>
        >,
    );

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Falha ao carregar configurações');
    }

    return response.data;
  }, []);

  const setSettings = useCallback(async (settings: Partial<AppSettings>) => {
    const response = await withRetry<SystemResult>(
      async () =>
        window.electronAPI.system.setSettings(
          settings,
        ) as Promise<SystemResult>,
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao salvar configurações');
    }

    return response;
  }, []);

  const resetApplication = useCallback(
    async (options: ResetApplicationOptions) => {
      const response = await withRetry<SystemResult>(
        async () =>
          window.electronAPI.system.resetApplication(
            options,
          ) as Promise<SystemResult>,
      );

      if (!response.success) {
        throw new Error(response.error ?? 'Falha ao resetar aplicação');
      }

      return response;
    },
    [],
  );

  const exportLogs = useCallback(async () => {
    const response = await withRetry<SystemResult>(
      async () =>
        window.electronAPI.system.exportLogs() as Promise<SystemResult>,
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao exportar logs');
    }

    return response;
  }, []);

  const clearLogs = useCallback(async () => {
    const response = await withRetry<SystemResult>(
      async () =>
        window.electronAPI.system.clearLogs() as Promise<SystemResult>,
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao limpar logs');
    }

    return response;
  }, []);

  const connectDrive = useCallback(async () => {
    const response = await withRetry<SystemResult>(
      async () =>
        window.electronAPI.system.connectDrive() as Promise<SystemResult>,
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao conectar Google Drive');
    }

    return response;
  }, []);

  const disconnectDrive = useCallback(async () => {
    const response = await withRetry<SystemResult>(
      async () =>
        window.electronAPI.system.disconnectDrive() as Promise<SystemResult>,
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao desconectar Google Drive');
    }

    return response;
  }, []);

  const createDebugBundle = useCallback(async () => {
    const response = await withRetry<SystemResult>(
      async () =>
        window.electronAPI.system.createDebugBundle() as Promise<SystemResult>,
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao criar pacote de debug');
    }

    return response;
  }, []);

  return {
    createBackup,
    getBackupList,
    restoreBackup,
    removeBackup,
    getSettings,
    setSettings,
    resetApplication,
    exportLogs,
    clearLogs,
    connectDrive,
    disconnectDrive,
    createDebugBundle,
  };
}
