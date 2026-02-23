import { FormEvent, useEffect, useMemo, useState } from 'react';

import TimePicker from '../../../components/TimePicker/TimePicker';
import { SelectOption } from '@/types/components.interfaces';
import CustomSelect from '@/components/CustomSelect/CustomSelect';
import useSystem from '@/hooks/useSystem';
import useSettingsStore from '@/store/useSettingsStore';
import { AppSettings, BackupMeta } from '@/types/settings.interfaces';

import styles from './BackupSettings.module.scss';

const intervalOptions: SelectOption[] = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
];

export default function BackupSettings() {
  const systemManager = useSystem();

  const settings = useSettingsStore((state) => state.settings);
  const backups = useSettingsStore((state) => state.backups);
  const setBackups = useSettingsStore((state) => state.setBackups);
  const loadFromStorage = useSettingsStore((state) => state.loadFromStorage);
  const loadFromSystem = useSettingsStore((state) => state.loadFromSystem);
  const saveToSystem = useSettingsStore((state) => state.saveToSystem);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [encrypt, setEncrypt] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [description, setDescription] = useState('');
  const [includeLargeFiles, setIncludeLargeFiles] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [operationLogs, setOperationLogs] = useState<string[]>([]);

  const appendLog = (message: string) => {
    setOperationLogs((prev) =>
      [new Date().toLocaleTimeString() + ' • ' + message, ...prev].slice(0, 10),
    );
  };

  useEffect(() => {
    loadFromStorage();

    void loadFromSystem(systemManager);

    const loadBackups = async () => {
      const loadedBackups = await systemManager.getBackupList();
      setBackups(loadedBackups as BackupMeta[]);
    };

    void loadBackups();
  }, [loadFromStorage, loadFromSystem, setBackups, systemManager]);

  const selectedInterval = useMemo(
    () =>
      intervalOptions.find(
        (option) => option.value === settings.backupSchedule.frequency,
      ),
    [settings.backupSchedule.frequency],
  );

  const persistSettings = async (
    partial: Parameters<typeof saveToSystem>[1],
    successMessage = 'Configuração salva com sucesso.',
  ) => {
    try {
      await saveToSystem(systemManager, partial);
      setToast({ type: 'success', message: successMessage });
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
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-label="Descrição do backup"
          />
        </label>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={encrypt}
            onChange={(event) => setEncrypt(event.target.checked)}
            aria-label="Criptografar backup"
          />
          Criptografar backup
        </label>

        {encrypt && (
          <>
            <label className={styles.encriptLabel}>
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-label="Senha do backup"
              />
            </label>

            <label className={styles.encriptLabel}>
              Confirmar senha
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-label="Confirmar senha do backup"
              />
            </label>
          </>
        )}

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={includeLargeFiles}
            onChange={(event) => setIncludeLargeFiles(event.target.checked)}
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
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={settings.backupAuto}
            onChange={(event) =>
              void persistSettings(
                { backupAuto: event.target.checked },
                'Backup automático atualizado.',
              )
            }
            aria-label="Ativar backup automático"
          />
          Backup automático
        </label>

        <CustomSelect
          label="Frequência"
          value={selectedInterval?.value}
          options={intervalOptions}
          onChange={(value) =>
            void persistSettings({
              backupSchedule: {
                ...settings.backupSchedule,
                frequency: value as AppSettings['backupSchedule']['frequency'],
              },
            })
          }
          className={styles.frequencySelect}
          dropdownClassName={styles.frequencyDropdown}
        />

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
          className={styles.timePicker}
          buttonClassName={styles.timeButton}
          dropdownClassName={styles.timeDropdown}
        />

        <label className={styles.numberLabel}>
          Retenção
          <input
            type="number"
            min={1}
            value={settings.backupRetention}
            onChange={(event) =>
              void persistSettings({
                backupRetention: Number(event.target.value) || 1,
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
