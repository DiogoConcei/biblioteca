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
  const [busyAction, setBusyAction] = useState<string | null>(null);

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

  const handleDriveConnection = async () => {
    setBusyAction('drive');

    try {
      if (settings.driveConnected) {
        await systemManager.disconnectDrive();
        await persistSettings({ driveConnected: false });
        appendLog('Google Drive desconectado.');
      } else {
        await systemManager.connectDrive();
        await persistSettings({ driveConnected: true });
        appendLog('Google Drive conectado.');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao conectar com o Drive';
      setToast({ type: 'error', message });
      appendLog(message);
    } finally {
      setBusyAction(null);
    }
  };

  const persistSettings = async (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    try {
      await systemManager.setSettings(partial);
      setToast({ type: 'success', message: 'Configuração salva com sucesso.' });
      appendLog('Configuração de sincronização atualizada.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar configuração';
      setToast({ type: 'error', message });
      appendLog(message);
    }
  };
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2>Sincronização / Cloud</h2>
        <p>Conecte o Google Drive para sincronizar backups.</p>
      </header>

      <div className={styles.actions}>
        <button
          type="button"
          disabled={busyAction !== null}
          onClick={() => void handleDriveConnection()}
          aria-label="Conectar ou desconectar Google Drive"
        >
          {busyAction === 'drive'
            ? 'Processando...'
            : settings.driveConnected
              ? 'Desconectar Drive'
              : 'Conectar Google Drive'}
        </button>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={settings.uploadBackupsToDrive}
            disabled={!settings.driveConnected}
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

      {toast && (
        <p className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </p>
      )}

      {operationLogs.length > 0 && (
        <section className={styles.logs}>
          <h3>Histórico</h3>
          <ul>
            {operationLogs.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
