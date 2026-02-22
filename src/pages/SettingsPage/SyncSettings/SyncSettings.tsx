import { useState } from 'react';

import useSystem from '@/hooks/useSystem';

import styles from './SyncSettings.module.scss';

import { AppSettings } from '@/types/settings.interfaces';

const defaultSettings: AppSettings = {
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

export default function SyncSettings() {
  const systemManager = useSystem();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [operationLogs, setOperationLogs] = useState<string[]>([]);

  const appendLog = (message: string) => {
    setOperationLogs((prev) =>
      [new Date().toLocaleTimeString() + ' • ' + message, ...prev].slice(0, 10),
    );
  };

  const persistSettings = async (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    try {
      await systemManager.setSettings(partial);
      setToast({ type: 'success', message: 'Configuração salva com sucesso.' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar configuração';
      setToast({ type: 'error', message });
      appendLog(message);
    }
  };
  return (
    <article className={styles.card}>
      <h2>Sincronização / Cloud</h2>
      <p>Conecte o Google Drive para sincronizar backups.</p>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={async () => {
            if (settings.driveConnected) {
              await systemManager.disconnectDrive();
              void persistSettings({ driveConnected: false });
              return;
            }

            await systemManager.connectDrive();
            void persistSettings({ driveConnected: true });
          }}
          aria-label="Conectar ou desconectar Google Drive"
        >
          {settings.driveConnected
            ? 'Desconectar Drive'
            : 'Conectar Google Drive'}
        </button>
        <label>
          <input
            type="checkbox"
            checked={settings.uploadBackupsToDrive}
            onChange={(e) =>
              void persistSettings({
                uploadBackupsToDrive: e.target.checked,
              })
            }
            aria-label="Enviar backups automaticamente ao Drive"
          />
          Enviar backups automaticamente ao Drive
        </label>
      </div>
    </article>
  );
}
