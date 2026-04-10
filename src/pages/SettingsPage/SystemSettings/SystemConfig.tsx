import { useState } from 'react';

import useSystem from '@/hooks/useSystem';
import { ComicCoverRegenerationProgress } from '@/types/settings.interfaces';

import styles from './SystemConfig.module.scss';

export default function SystemConfig() {
  const systemManager = useSystem();

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [coverRegenProgress, setCoverRegenProgress] =
    useState<ComicCoverRegenerationProgress | null>(null);

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
    </section>
  );
}

