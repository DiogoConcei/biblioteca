import { useNavigate } from 'react-router-dom';

import styles from './ErrorScreen.module.scss';
import { ErrorScreenProps } from '../../types/components.interfaces';
import { useUIStore } from '../../store/useUIStore';

export default function ErrorScreen({ error, serieName }: ErrorScreenProps) {
  const navigate = useNavigate();
  const clearError = useUIStore((state) => state.clearError);

  const goToSeriePage = async () => {
    try {
      const toSeriePage = await window.electronAPI.userAction.returnPage(
        '',
        serieName,
      );
      const serieLink = toSeriePage.data;

      if (!serieLink) {
        console.error('Erro ao obter o link da série');
        return;
      }

      navigate(serieLink);
    } catch (e) {
      console.error(e);
    }
  };

  const goToHome = () => {
    navigate('/');
    clearError();
  };

  return (
    <div className={styles.backgroundError}>
      <div className={styles.errorPopup} role="alert">
        <h1>Ocorreu um erro inesperado</h1>

        <div className={styles.mainInfo}>
          <p className={styles.errorMessage}>
            O sistema apresentou o seguinte erro: <span>{error}</span>
          </p>

          <p>
            Porém, não se preocupe, pois todas as suas informações foram
            devidamente salvas.
          </p>

          <p>
            Estamos trabalhando para resolver o problema o mais rápido possível.
          </p>
        </div>

        <div className={styles.secondaryInfo}>
          {serieName && (
            <p>
              Por favor, retorne à página inicial da aplicação ou acesse a
              página principal para continuar lendo mais capítulos de
              <strong> {serieName}</strong>.
            </p>
          )}

          <p>Agradecemos pela sua compreensão.</p>
        </div>
      </div>

      <div className={styles.ButtonContainer}>
        <button onClick={goToHome} className={styles.errorButton}>
          Página Inicial
        </button>

        {serieName && goToSeriePage && (
          <button onClick={goToSeriePage} className={styles.errorButton}>
            Página dedicada a {serieName}
          </button>
        )}
      </div>
    </div>
  );
}
