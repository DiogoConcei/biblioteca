import { FormEvent, useState } from 'react';

import { BackupMeta, AppSettings } from '@/types/settings.interfaces';
import useSystem from '@/hooks/useSystem';

import TimePicker from '../../../components/TimePicker/TimePicker';
import styles from './BackupSettings.module.scss';



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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [interval, setInterval] = useState<'diário' | 'semanal' | 'mensal'>(
    'diário',
  );

  const intervalOptions: ('diário' | 'semanal' | 'mensal')[] = [
    'diário',
    'semanal',
    'mensal',
  ];

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [encrypt, setEncrypt] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [description, setDescription] = useState('');
  const [includeLargeFiles, setIncludeLargeFiles] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const persistSettings = async (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    try {
      await systemManager.setSettings(partial);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const handleCreateBackup = async (event: FormEvent) => {
    event.preventDefault();

    if (encrypt && password !== confirmPassword) {
      return;
    }

    setBusyAction('create-backup');

    try {
      await systemManager.createBackup({
        encrypt,
        password: encrypt ? password : undefined,
        description,
        includeLargeFiles,
      });

      setBackups(await systemManager.getBackupList());
      setDescription('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Falha ao criar backup:', error);
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
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Descrição do backup"
          />
        </label>

        <input
          type="checkbox"
          id="check_cript"
          checked={encrypt}
          onChange={(e) => setEncrypt(e.target.checked)}
          aria-label="Criptografar backup"
        />

        <label htmlFor="check_cript" className={styles.cript_label}>
          Criptografar backup
        </label>

        {encrypt && (
          <>
            <label className={styles.encriptLabel}>
              Senha
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Senha do backup"
              />
            </label>

            <label className={styles.encriptLabel}>
              Confirmar senha
              <input
                type="text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-label="Confirmar senha do backup"
              />
            </label>
          </>
        )}

        <input
          type="checkbox"
          id={'largeFilesInput'}
          checked={includeLargeFiles}
          onChange={(e) => setIncludeLargeFiles(e.target.checked)}
          aria-label="Incluir arquivos grandes"
        />

        <label htmlFor="largeFilesInput" className={styles.largeFilesLabel}>
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
        <div className={styles.backupDiv}>
          <input
            type="checkbox"
            id="backupAut"
            checked={settings.backupAuto}
            onChange={(e) =>
              void persistSettings({ backupAuto: e.target.checked })
            }
            aria-label="Ativar backup automático"
          />

          <label htmlFor="backupAut" className={styles.backupLabel}>
            Backup automático
          </label>

          <div className={styles['dropdown-wrapper']}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className={styles.backupFrequency}
            >
              {interval}
            </button>

            {isOpen && (
              <ul className={styles['dropdown-list']}>
                {intervalOptions.map((interval) => (
                  <li key={interval} className={styles['dropdown-item']}>
                    <button
                      className={styles['dropdown-option']}
                      onClick={() => {
                        setInterval(interval);
                        setIsOpen((prev) => !prev);
                      }}
                    >
                      {interval}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <TimePicker
          value={settings.backupSchedule.time}
          onChange={(time) =>
            void persistSettings({
              backupSchedule: {
                ...settings.backupSchedule,
                time,
              },
            })
          }
        />

        {/* <label>
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
         */}
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
