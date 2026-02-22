import { FormEvent, useState } from 'react';

import styles from './BackupSettings.module.scss';

import {
  BackupMeta,
  AppSettings,
  BackupFrequency,
} from '@/types/settings.interfaces';

import useSystem from '@/hooks/useSystem';

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

export default function BackupSettings() {
  const systemManager = useSystem();

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [encrypt, setEncrypt] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [description, setDescription] = useState('');
  const [includeLargeFiles, setIncludeLargeFiles] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
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

  const handleCreateBackup = async (event: FormEvent) => {
    event.preventDefault();

    if (encrypt && password !== confirmPassword) {
      setToast({
        type: 'error',
        message: 'A confirmação da senha não confere.',
      });
      return;
    }

    setBusyAction('create-backup');
    appendLog('Iniciando criação de backup manual...');

    try {
      const result = await systemManager.createBackup({
        encrypt,
        password: encrypt ? password : undefined,
        description,
        includeLargeFiles,
      });

      appendLog(`Backup criado em ${result.path ?? 'caminho não informado'}`);
      setToast({
        type: 'success',
        message: `Backup criado: ${result.path ?? 'ok'}`,
      });
      setBackups(await systemManager.getBackupList());
      setDescription('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao criar backup';
      appendLog(message);
      setToast({ type: 'error', message });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <article className={styles.card}>
      <h2>Backup</h2>
      <p>Crie backups, ajuste retenção e programe backups automáticos.</p>
      <form onSubmit={handleCreateBackup} className={styles.form}>
        <label>
          Descrição do backup
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Descrição do backup"
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={encrypt}
            onChange={(e) => setEncrypt(e.target.checked)}
            aria-label="Criptografar backup"
          />
          Criptografar backup
        </label>
        {encrypt && (
          <>
            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Senha do backup"
              />
            </label>
            <label>
              Confirmar senha
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-label="Confirmar senha do backup"
              />
            </label>
          </>
        )}
        <label>
          <input
            type="checkbox"
            checked={includeLargeFiles}
            onChange={(e) => setIncludeLargeFiles(e.target.checked)}
            aria-label="Incluir arquivos grandes"
          />
          Incluir arquivos grandes
        </label>
        <button
          type="submit"
          disabled={busyAction === 'create-backup'}
          aria-label="Criar backup agora"
        >
          {busyAction === 'create-backup'
            ? 'Criando backup...'
            : 'Criar Backup Agora'}
        </button>
      </form>

      <div className={styles.inlineSettings}>
        <label>
          <input
            type="checkbox"
            checked={settings.backupAuto}
            onChange={(e) =>
              void persistSettings({ backupAuto: e.target.checked })
            }
            aria-label="Ativar backup automático"
          />
          Backup automático
        </label>
        <select
          value={settings.backupSchedule.frequency}
          onChange={(e) =>
            void persistSettings({
              backupSchedule: {
                ...settings.backupSchedule,
                frequency: e.target.value as BackupFrequency,
              },
            })
          }
          aria-label="Frequência do backup automático"
        >
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </select>
        <input
          type="time"
          value={settings.backupSchedule.time}
          onChange={(e) =>
            void persistSettings({
              backupSchedule: {
                ...settings.backupSchedule,
                time: e.target.value,
              },
            })
          }
          aria-label="Horário do backup automático"
        />
        <label>
          Retenção
          <input
            type="number"
            min={1}
            value={settings.backupRetention}
            onChange={(e) =>
              void persistSettings({
                backupRetention: Number(e.target.value) || 1,
              })
            }
            aria-label="Quantidade máxima de backups"
          />
        </label>
      </div>

      <ul className={styles.backupList}>
        {backups.map((backup) => (
          <li key={backup.id}>
            <div>
              <strong>{new Date(backup.createdAt).toLocaleString()}</strong>
              <small>{backup.path}</small>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => void systemManager.restoreBackup(backup.path)}
                aria-label={`Restaurar backup ${backup.id}`}
              >
                Restaurar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await systemManager.removeBackup(backup.path);
                  setBackups(await systemManager.getBackupList());
                }}
                aria-label={`Remover backup ${backup.id}`}
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
