import './ErrorScreen.css';
import { useNavigate } from 'react-router-dom';

import { ErrorScreenProps } from '../../types/components.interfaces';

export default function ErrorScreen({ error, serieName }: ErrorScreenProps) {
  const navigate = useNavigate();

  const goToSeriePage = async () => {
    try {
      const toSeriePage = await window.electronAPI.userAction.returnPage(serieName);
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
  };

  return (
    <div className="background-error">
      <div className="error-popup" role="alert">
        <h1>Ocorreu um erro inesperado</h1>
        <div className="mainInfo">
          <p className="error-message">
            O sistema apresentou o seguinte erro: <span>{error}</span>
          </p>
          <p>Porém, não se preocupe, pois todas as suas informações foram devidamente salvas.</p>
          <p>Estamos trabalhando para resolver o problema o mais rápido possível.</p>
        </div>
        <div className="secondaryInfo">
          <p>
            Por favor, retorne à página inicial da aplicação ou acesse a página principal para
            continuar lendo mais capítulos de <strong>{serieName}</strong>.
          </p>
          <p>Agradecemos pela sua compreensão.</p>
        </div>
      </div>
      <div className="error-button-container">
        <button onClick={goToHome} className="error-button">
          Página Inicial
        </button>
        <button onClick={goToSeriePage} className="error-button">
          Página dedicada a {serieName}
        </button>
      </div>
    </div>
  );
}
