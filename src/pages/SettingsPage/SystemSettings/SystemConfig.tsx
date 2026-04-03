import { useState, useMemo } from 'react';

import useSystem from '@/hooks/useSystem';
import { ComicCoverRegenerationProgress } from '@/types/settings.interfaces';

import styles from './SystemConfig.module.scss';

export default function SystemConfig() {
  const systemManager = useSystem();

  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [resetType, setResetType] = useState<'soft' | 'full'>('soft');
  const resetOptions: ('soft' | 'full')[] = ['soft', 'full'];
  const backupOptions = [
    'collections',
    'favorites',
    'credentials',
    'scraper cache',
  ];
  const [backupBeforeReset] = useState(true);
  const [preserve, setPreserve] = useState<string[]>([]);
  const [confirmResetInput, setConfirmResetInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [coverRegenProgress, setCoverRegenProgress] =
    useState<ComicCoverRegenerationProgress | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const canConfirmReset = useMemo(
    () => (resetType === 'full' ? confirmResetInput.trim() === 'RESET' : true),
    [confirmResetInput, resetType],
  );

  const handleRegenerateComicCovers = async () => {
    setBusyAction('regenerate-covers');
    setCoverRegenProgress({
      total: 0,
      processed: 0,
      regenerated: 0,
      skipped: 0,
      failed: 0,
    });

    try {
      const result = await systemManager.regenerateComicCovers();

      if (result.failed > 0) {
        console.error(`Regeneração finalizada com falhas: ${result.failed}`);
      }
    } catch (error) {
      console.error('Falha ao regenerar capas dos quadrinhos:', error);
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
      return;
    }
    setBusyAction('reset');

    try {
      if (backupBeforeReset) {
        await systemManager.createBackup({
          description: 'Backup automático pré-reset',
        });
      }

      await systemManager.resetApplication({
        level: resetType,
        backupBefore: backupBeforeReset,
        preserve,
      });

      setShowResetModal(false);
    } catch (error) {
      console.error('Falha ao resetar:', error);
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
