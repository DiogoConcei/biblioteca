import useSystem from '@/hooks/useSystem';
import { useState } from 'react';

import { AppSettings } from '@/types/settings.interfaces';

import styles from './AppearanceSettings.module.scss';

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

export default function AppearanceSettings() {
  const systemManager = useSystem();

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
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
      appendLog('Preferências visuais atualizadas.');
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
        <h2>Tema / Aparência</h2>
        <p>Ajuste modo de tema, cor principal e espaçamento.</p>
      </header>

      <div className={styles.form}>
        <label>
          Tema
          <select
            value={settings.themeMode}
            onChange={(e) =>
              void persistSettings({
                themeMode: e.target.value as AppSettings['themeMode'],
              })
            }
            aria-label="Modo de tema"
          >
            <option value="system">Sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </label>
        <label>
          Cor de destaque
          <input
            type="color"
            value={settings.accentColor}
            onChange={(e) =>
              void persistSettings({ accentColor: e.target.value })
            }
            aria-label="Cor de destaque"
          />
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={settings.compactMode}
            onChange={(e) =>
              void persistSettings({ compactMode: e.target.checked })
            }
            aria-label="Ativar modo compacto"
          />
          Modo compacto
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
