import { FormEvent, useEffect, useMemo, useState } from 'react';
import useSystem from '../../hooks/useSystem';
import {
  AppSettings,
  BackupFrequency,
  BackupMeta,
  ComicCoverRegenerationProgress,
} from '../../types/settings.interfaces';
import styles from './SettingsPage.module.scss';

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

export default function SettingsPage() {
  const systemManager = useSystem();

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [status, setStatus] = useState('Carregando configurações...');
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [encrypt, setEncrypt] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [includeLargeFiles, setIncludeLargeFiles] = useState(false);
  const [resetType, setResetType] = useState<'soft' | 'full'>('soft');
  const [backupBeforeReset, setBackupBeforeReset] = useState(true);
  const [preserve, setPreserve] = useState<string[]>([]);
  const [confirmResetInput, setConfirmResetInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [operationLogs, setOperationLogs] = useState<string[]>([]);
  const [coverRegenProgress, setCoverRegenProgress] =
    useState<ComicCoverRegenerationProgress | null>(null);

  const canConfirmReset = useMemo(
    () => (resetType === 'full' ? confirmResetInput.trim() === 'RESET' : true),
    [confirmResetInput, resetType],
  );

  useEffect(() => {
    const handleProgress = (_event: unknown, payload: unknown) => {
      if (!payload || typeof payload !== 'object') return;

      const progress = payload as ComicCoverRegenerationProgress;
      setCoverRegenProgress(progress);
    };

    window.electronAPI.on(
      'system:comic-cover-regeneration-progress',
      handleProgress,
    );

    return () => {
      window.electronAPI.off(
        'system:comic-cover-regeneration-progress',
        handleProgress,
      );
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [loadedSettings, loadedBackups] = await Promise.all([
          systemManager.getSettings(),
          systemManager.getBackupList(),
        ]);

        setSettings(loadedSettings);
        setBackups(loadedBackups);
        setStatus('Configurações carregadas com sucesso.');
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Falha ao carregar configurações';
        setToast({ type: 'error', message });
        setStatus(message);
      }
    };

    void load();
  }, [systemManager]);

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

  const onPreserveChange = (field: string, checked: boolean) => {
    setPreserve((prev) => {
      if (checked) {
        return [...new Set([...prev, field])];
      }

      return prev.filter((item) => item !== field);
    });
  };

  const handleRegenerateComicCovers = async () => {
    setBusyAction('regenerate-covers');
    setCoverRegenProgress({
      total: 0,
      processed: 0,
      regenerated: 0,
      skipped: 0,
      failed: 0,
    });
    appendLog('Iniciando regeneração global de capas dos quadrinhos...');

    try {
      const result = await systemManager.regenerateComicCovers();
      appendLog(
        `Regeneração finalizada: ${result.regenerated} regeneradas, ${result.skipped} íntegras, ${result.failed} falhas.`,
      );

      if (result.failed > 0) {
        const firstFailure = result.failures[0];
        setToast({
          type: 'error',
          message: `Processo concluído com falhas (${result.failed}). Exemplo: ${firstFailure?.comic ?? 'N/A'} - ${firstFailure?.reason ?? ''}`,
        });
      } else {
        setToast({
          type: 'success',
          message: `Processo concluído. ${result.regenerated} capas regeneradas com sucesso.`,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Falha ao regenerar capas dos quadrinhos';
      appendLog(message);
      setToast({ type: 'error', message });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <main className={styles.settingsPage}>
      <header className={styles.pageHeader}>
        <h1>Configurações</h1>
        <p role="status" aria-live="polite">
          {status}
        </p>
      </header>

      {toast && (
        <div
          className={`${styles.toast} ${styles[toast.type]}`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      <section className={styles.grid}>
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
                    onClick={() =>
                      void systemManager.restoreBackup(backup.path)
                    }
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

        <article className={styles.card}>
          <h2>Tema / Aparência</h2>
          <p>Ajuste modo de tema, cor principal e espaçamento.</p>
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
            <label>
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
        </article>

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

        <article className={styles.card}>
          <h2>Privacidade & Logs</h2>
          <p>
            Exporte logs, limpe dados de diagnóstico e controle envio de bug
            report.
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

        <article className={styles.card}>
          <h2>Avançado</h2>
          <p>Ações de manutenção e diagnósticos de suporte.</p>
          <button
            type="button"
            onClick={() => void systemManager.createDebugBundle()}
            aria-label="Criar pacote de debug"
          >
            Criar debug bundle
          </button>

          <button
            type="button"
            onClick={() => void handleRegenerateComicCovers()}
            disabled={busyAction === 'regenerate-covers'}
            aria-label="Regerar todas as capas dos quadrinhos"
          >
            {busyAction === 'regenerate-covers'
              ? 'Regenerando capas...'
              : 'Regerar todas as capas dos quadrinhos'}
          </button>

          {coverRegenProgress && (
            <div className={styles.progressBlock}>
              <strong>Progresso da regeneração</strong>
              <progress
                max={Math.max(coverRegenProgress.total, 1)}
                value={coverRegenProgress.processed}
              />
              <small>
                {coverRegenProgress.processed}/{coverRegenProgress.total} •
                Regeneradas: {coverRegenProgress.regenerated} • Íntegras:{' '}
                {coverRegenProgress.skipped} • Falhas:{' '}
                {coverRegenProgress.failed}
              </small>
              {coverRegenProgress.currentComic && (
                <small>Atual: {coverRegenProgress.currentComic}</small>
              )}
            </div>
          )}
        </article>

        <article className={`${styles.card} ${styles.danger}`}>
          <h2>Reset / Restaurar</h2>
          <p>Operações destrutivas: revise as opções antes de confirmar.</p>
          <div className={styles.form}>
            <label>
              Tipo de reset
              <select
                value={resetType}
                onChange={(e) =>
                  setResetType(e.target.value as 'soft' | 'full')
                }
                aria-label="Tipo de reset"
              >
                <option value="soft">Soft reset (cache e temporários)</option>
                <option value="full">Full reset (dados locais)</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={backupBeforeReset}
                onChange={(e) => setBackupBeforeReset(e.target.checked)}
                aria-label="Criar backup antes do reset"
              />
              Criar backup automaticamente antes do reset
            </label>
            {['collections', 'favorites', 'credentials', 'scraper cache'].map(
              (item) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    checked={preserve.includes(item)}
                    onChange={(e) => onPreserveChange(item, e.target.checked)}
                    aria-label={`Preservar ${item}`}
                  />
                  Preservar {item}
                </label>
              ),
            )}
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              aria-label="Abrir confirmação de reset"
            >
              Revisar e confirmar reset
            </button>
          </div>
        </article>
      </section>

      {showResetModal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar reset"
        >
          <div className={styles.modal}>
            <h3>Confirmação de reset</h3>
            <p>
              Você está prestes a executar um <strong>{resetType}</strong>{' '}
              reset.
              {resetType === 'full' &&
                ' Esta ação pode apagar dados locais permanentemente.'}
            </p>
            {resetType === 'full' && (
              <label>
                Digite RESET para confirmar
                <input
                  value={confirmResetInput}
                  onChange={(e) => setConfirmResetInput(e.target.value)}
                  aria-label="Digite RESET para confirmar"
                />
              </label>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                aria-label="Cancelar reset"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleReset()}
                disabled={!canConfirmReset || busyAction === 'reset'}
                aria-label="Confirmar reset"
              >
                {busyAction === 'reset' ? 'Executando...' : 'Confirmar reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={styles.logs} aria-live="polite">
        <h3>Histórico de operações</h3>
        <ul>
          {operationLogs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
