import { useState, useMemo } from 'react';

import useSystem from '@/hooks/useSystem';

import { ComicCoverRegenerationProgress } from '@/types/settings.interfaces';
import styles from './SystemConfig.module.scss';

export default function SystemConfig() {
  const systemManager = useSystem();

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [resetType, setResetType] = useState<'soft' | 'full'>('soft');
  const resetOptions: ('soft' | 'full')[] = ['soft', 'full'];
  const backupOptions = [
    'collections',
    'favorites',
    'credentials',
    'scraper cache',
  ];
  const [backupBeforeReset, setBackupBeforeReset] = useState(true);
  const [preserve, setPreserve] = useState<string[]>([]);
  const [confirmResetInput, setConfirmResetInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [operationLogs, setOperationLogs] = useState<string[]>([]);
  const [coverRegenProgress, setCoverRegenProgress] =
    useState<ComicCoverRegenerationProgress | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const canConfirmReset = useMemo(
    () => (resetType === 'full' ? confirmResetInput.trim() === 'RESET' : true),
    [confirmResetInput, resetType],
  );

  const appendLog = (message: string) => {
    setOperationLogs((prev) =>
      [new Date().toLocaleTimeString() + ' • ' + message, ...prev].slice(0, 10),
    );
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

      console.log('executou aqui 3');
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

  return (
    <section className={styles.card}>
      <article className={styles.diagnostic}>
        <h2>Ações de manutenção e diagnotisco de suporte</h2>

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
              {coverRegenProgress.skipped} • Falhas: {coverRegenProgress.failed}
            </small>
            {coverRegenProgress.currentComic && (
              <small>Atual: {coverRegenProgress.currentComic}</small>
            )}
          </div>
        )}
      </article>

      <article className={`${styles.danger}`}>
        <h2>Reset / Restaurar</h2>
        <p>Operações destrutivas: revise as opções antes de confirmar.</p>
        <div className={styles.form}>
          <div className={styles.resetArea}>
            <label>Tipo de reset</label>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className={styles.resetTypes}
            >
              {resetType === 'soft'
                ? 'Soft (cache e temporário)'
                : 'Full (dados locais)'}
            </button>

            {isOpen && (
              <ul className={styles['dropdown-list']}>
                {resetOptions.map((type) => (
                  <li key={type} className={styles['dropdown-item']}>
                    <button
                      className={styles['dropdown-option']}
                      onClick={() => {
                        setResetType(type);
                        setIsOpen(false);
                      }}
                    >
                      {type}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.backupOptions}>
            <label className="mainLabel">
              Criar backup automaticamente antes do reset
            </label>

            {backupOptions.map((item) => (
              <div key={item} className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  id={`preserve_${item}`}
                  checked={preserve.includes(item)}
                  onChange={(e) => onPreserveChange(item, e.target.checked)}
                />

                <label htmlFor={`preserve_${item}`}>
                  <span>Preservar {item}</span>
                </label>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              aria-label="Abrir confirmação de reset"
            >
              Revisar e confirmar reset
            </button>
          </div>
        </div>
      </article>

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
    </section>
  );
}
