import styles from './ErrorScreen.module.scss';
import { ErrorScreenProps } from '../../types/components.interfaces';
import { useUIStore } from '../../store/useUIStore';

export default function ErrorScreen({ error, serieName, onReset }: ErrorScreenProps & { onReset?: () => void }) {
  const clearError = useUIStore((state) => state.clearError);

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    clearError();
    window.location.hash = '/'; // Fallback seguro para navegação em caso de falha grave
    window.location.reload();   // Recarrega para limpar o estado de crash do React
  };

  const handleRetrySerie = async () => {
    if (!serieName) return;
    try {
      const response = await window.electronAPI.userAction.returnPage('', serieName);
      if (response.data) {
        window.location.hash = response.data;
        window.location.reload();
      }
    } catch (e) {
      console.error('Falha ao tentar retornar para a série:', e);
      handleReset();
    }
  };

  return (
    <div className={styles.backgroundError}>
      <div className={styles.errorPopup} role="alert">
        <h1>Ocorreu um erro inesperado</h1>

        <div className={styles.mainInfo}>
          <p className={styles.errorMessage}>
            O sistema apresentou o seguinte erro: <span>{error}</span>
          </p>
          <p>Não se preocupe, tentaremos recuperar o seu progresso.</p>
        </div>

        <div className={styles.secondaryInfo}>
          <p>Agradecemos pela sua compreensão.</p>
        </div>
      </div>

      <div className={styles.ButtonContainer}>
        <button onClick={handleReset} className={styles.errorButton}>
          Página Inicial
        </button>

        {serieName && (
          <button onClick={handleRetrySerie} className={styles.errorButton}>
            Voltar para {serieName}
          </button>
        )}
      </div>
    </div>
  );
}
