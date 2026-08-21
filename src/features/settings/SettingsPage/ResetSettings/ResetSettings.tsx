import { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw, ShieldAlert } from 'lucide-react';

import useSystem from '@/shared/hooks/useSystem';
import { ComicCoverRegenerationProgress } from '@/types/settings.interfaces';

import styles from './ResetSettings.module.scss';

export default function ResetSettings() {
  const systemManager = useSystem();

  const [showFullResetModal, setShowFullResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Estados para diagnóstico
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [coverRegenProgress, setCoverRegenProgress] =
    useState<ComicCoverRegenerationProgress | null>(null);

  const handleSoftReset = async () => {
    if (!window.confirm('Deseja limpar os logs e arquivos temporários?'))
      return;

    try {
      await systemManager.resetApplication({ level: 'soft' });
      alert('Cache e logs limpos com sucesso.');
    } catch (error) {
      console.error('Erro no soft reset:', error);
      alert('Falha ao limpar cache.');
    }
  };

  const handleFullReset = async () => {
    if (confirmText !== 'RESET') return;

    setIsResetting(true);
    try {
      // O backend cuidará de mover para a lixeira e reiniciar o app
      await systemManager.resetApplication({ level: 'full' });
    } catch (error) {
      console.error('Erro no factory reset:', error);
      alert('Falha ao executar reset de fábrica.');
      setIsResetting(false);
      setShowFullResetModal(false);
    }
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
    <div className={styles.container}>
      <article className={styles.diagnostic}>
        <h2>Ações de manutenção e diagnóstico de suporte</h2>

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

      <section className={styles.section}>
        <h2>
          <RefreshCw size={24} /> Sistema e Manutenção
        </h2>
        <p>
          Utilize estas opções para resolver problemas de desempenho ou limpar
          arquivos que não são mais necessários.
        </p>

        <div className={styles.actions}>
          <button className={styles.primary} onClick={handleSoftReset}>
            Limpar Cache e Logs
          </button>
        </div>
        <ul className={styles.infoList}>
          <li>Remove apenas arquivos de log e cache temporário.</li>
          <li>Sua biblioteca e configurações permanecem intactas.</li>
        </ul>
      </section>

      <section className={`${styles.section} ${styles.dangerZone}`}>
        <h2>
          <AlertTriangle size={24} /> Zona de Perigo
        </h2>
        <p>
          As ações abaixo são destrutivas e restauram o aplicativo ao seu estado
          original de instalação.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.danger}
            onClick={() => setShowFullResetModal(true)}
          >
            <Trash2 size={18} style={{ marginRight: '8px' }} />
            Restaurar Padrões de Fábrica
          </button>
        </div>

        <ul className={styles.infoList}>
          <li>Moverá toda a sua biblioteca para a lixeira.</li>
          <li>Removerá todas as configurações e preferências.</li>
          <li>O aplicativo será reiniciado imediatamente após a ação.</li>
        </ul>
      </section>

      {showFullResetModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>
              <ShieldAlert size={28} /> Confirmar Reset de Fábrica
            </h3>
            <p>
              Esta ação moverá todos os dados da aplicação (coleções, capas,
              configurações e biblioteca local) para a <strong>Lixeira</strong>{' '}
              do seu sistema.
            </p>
            <p className={styles.confirmationText}>
              Para prosseguir, digite <strong>RESET</strong> no campo abaixo:
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Digite RESET"
              autoFocus
            />

            <div className={styles.modalActions}>
              <button
                className={styles.cancel}
                onClick={() => {
                  setShowFullResetModal(false);
                  setConfirmText('');
                }}
                disabled={isResetting}
              >
                Cancelar
              </button>
              <button
                className={styles.confirm}
                disabled={confirmText !== 'RESET' || isResetting}
                onClick={handleFullReset}
              >
                {isResetting ? 'Reiniciando...' : 'Confirmar e Resetar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
