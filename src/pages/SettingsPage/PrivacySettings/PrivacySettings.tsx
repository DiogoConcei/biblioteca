import { useState, useMemo } from 'react';

import useUIStore from '@/store/useUIStore';

import useSystem from '@/hooks/useSystem';

import styles from './Privacy.module.scss';

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

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [operationLogs, setOperationLogs] = useState<string[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetType, setResetType] = useState<'soft' | 'full'>('soft');
  const [backupBeforeReset, setBackupBeforeReset] = useState(true);
  const [preserve, setPreserve] = useState<string[]>([]);
  const [confirmResetInput, setConfirmResetInput] = useState('');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const canConfirmReset = useMemo(
    () => (resetType === 'full' ? confirmResetInput.trim() === 'RESET' : true),
    [confirmResetInput, resetType],
  );

  const appendLog = (message: string) => {
    setOperationLogs((prev) =>
      [new Date().toLocaleTimeString() + ' • ' + message, ...prev].slice(0, 10),
    );
  };

  const isLoading = useUIStore((s) => s.loading);

  const onPreserveChange = (field: string, checked: boolean) => {
    setPreserve((prev) => {
      if (checked) {
        return [...new Set([...prev, field])];
      }

      return prev.filter((item) => item !== field);
    });
  };

  const handleReset = async () => {
    if (!canConfirmReset) {
      setToast({
        type: 'error',
        message: 'Digite RESET para confirmar reset completo.',
      });
      return;
    }

    setBusyAction('reset');
    appendLog(`Executando reset ${resetType}...`);

    try {
      if (backupBeforeReset) {
        appendLog('Criando backup pré-reset...');
        await systemManager.createBackup({
          description: 'Backup automático pré-reset',
        });
      }

      await systemManager.resetApplication({
        level: resetType,
        backupBefore: backupBeforeReset,
        preserve,
      });

      appendLog('Reset finalizado com sucesso.');
      setToast({ type: 'success', message: 'Reset aplicado com sucesso.' });
      setShowResetModal(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao resetar';
      appendLog(message);
      setToast({ type: 'error', message });
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar configuração';
      setToast({ type: 'error', message });
      appendLog(message);
    }
  };

  return (
    <article className={styles.card}>
      <h2>Privacidade & Logs</h2>
      <p>
        Exporte logs, limpe dados de diagnóstico e controle envio de bug report.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => void systemManager.exportLogs()}
          aria-label="Exportar logs"
        >
          Exportar logs
        </button>
        <button
          type="button"
          onClick={() => void systemManager.clearLogs()}
          aria-label="Limpar logs"
        >
          Limpar logs
        </button>
        <label>
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
      </div>
    </article>
  );
}
