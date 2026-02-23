import useSystem from '@/hooks/useSystem';
import { useEffect, useState } from 'react';

import useSettingsStore from '@/store/useSettingsStore';

import styles from './PrivacySettings.module.scss';
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

export default function Privacy() {
  const systemManager = useSystem();
  const settings = useSettingsStore((state) => state.settings);
  const loadFromStorage = useSettingsStore((state) => state.loadFromStorage);
  const loadFromSystem = useSettingsStore((state) => state.loadFromSystem);
  const saveToSystem = useSettingsStore((state) => state.saveToSystem);

  useEffect(() => {
    loadFromStorage();
    void loadFromSystem(systemManager);
  }, [loadFromStorage, loadFromSystem, systemManager]);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [operationLogs, setOperationLogs] = useState<string[]>([]);

  const appendLog = (message: string) => {
    setOperationLogs((prev) =>
      [new Date().toLocaleTimeString() + ' • ' + message, ...prev].slice(0, 10),
    );
  };

  const persistSettings = async (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    try {
      await saveToSystem(systemManager, partial);
      setToast({ type: 'success', message: 'Configuração salva com sucesso.' });
      appendLog('Preferências de privacidade atualizadas.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar configuração';
      setToast({ type: 'error', message });
      appendLog(message);
    }
  };

  const handleExportLogs = async () => {
    setBusyAction('export');
    try {
      await systemManager.exportLogs();
      setToast({ type: 'success', message: 'Logs exportados com sucesso.' });
      appendLog('Logs exportados.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao exportar logs';
      setToast({ type: 'error', message });
      appendLog(message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleClearLogs = async () => {
    setBusyAction('clear');
    try {
      await systemManager.clearLogs();
      setToast({ type: 'success', message: 'Logs limpos com sucesso.' });
      appendLog('Logs locais removidos.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao limpar logs';
      setToast({ type: 'error', message });
      appendLog(message);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2>Privacidade & Logs</h2>
        <p>
          Exporte logs, limpe dados de diagnóstico e controle envio de bug
          report.
        </p>
      </header>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => void handleExportLogs()}
          disabled={busyAction !== null}
          aria-label="Exportar logs"
        >
          {busyAction === 'export' ? 'Exportando...' : 'Exportar logs'}
        </button>
        <button
          type="button"
          onClick={() => void handleClearLogs()}
          disabled={busyAction !== null}
          aria-label="Limpar logs"
        >
          {busyAction === 'clear' ? 'Limpando...' : 'Limpar logs'}
        </button>
      </div>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={settings.sendLogsWithBugReport}
          onChange={(e) =>
            void persistSettings({
              sendLogsWithBugReport: e.target.checked,
            })
          }
          aria-label="Enviar logs com bug report"
        />
        Enviar logs anexados ao bug report
      </label>

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
