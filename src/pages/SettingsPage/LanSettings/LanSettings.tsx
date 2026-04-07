import { useEffect, useState } from 'react';

import styles from './LanSettings.module.scss';

export default function LanSettings() {
  const [lanStatus, setLanStatus] = useState<{ active: boolean; url: string; token: string }>({ active: false, url: '', token: '' });
  const [errorLog, setErrorLog] = useState<string | null>(null);

  useEffect(() => {
    const loadLanStatus = async () => {
      try {
        const status = await window.electronAPI.lan.getStatus();
        setLanStatus(status);
      } catch (err) {
        setErrorLog('Erro ao carregar status do servidor LAN: ' + String(err));
      }
    };
    void loadLanStatus();
  }, []);

  const toggleLanServer = async () => {
    try {
      setErrorLog(null);
      if (lanStatus.active) {
        const res = await window.electronAPI.lan.stop();
        if (res.success) setLanStatus({ active: res.active, url: res.url, token: res.token });
        else setErrorLog(res.error || 'Erro desconhecido ao parar o servidor.');
      } else {
        const res = await window.electronAPI.lan.start();
        if (res.success) setLanStatus({ active: res.active, url: res.url, token: res.token });
        else setErrorLog(res.error || 'Erro desconhecido ao iniciar o servidor.');
      }
    } catch (e) {
      setErrorLog('Erro ao alterar servidor LAN: ' + String(e));
    }
  };

  return (
    <section className={styles.card}>
      <article>
        <h2>Compartilhamento em Rede (LAN)</h2>
        <p>Permite acessar a biblioteca a partir do navegador de um dispositivo móvel na mesma rede Wi-Fi.</p>
        
        <div className={styles.actions}>
          <button type="button" onClick={() => void toggleLanServer()}>
            {lanStatus.active ? 'Desativar Servidor LAN' : 'Ativar Servidor LAN'}
          </button>
        </div>

        {errorLog && (
          <p className={styles.errorText}>{errorLog}</p>
        )}

        {lanStatus.active && (
          <div className={styles.inlineSettings}>
            <p>
              <strong>Acesse no celular: </strong>
              <a href={lanStatus.url} target="_blank" rel="noreferrer" className={styles.link}>
                {lanStatus.url}
              </a>
            </p>
            <p>
              <strong>Token de Sessão: </strong>
              <code>{lanStatus.token}</code>
            </p>
            <p className={styles.warningInfo}>
              <em>Mantenha o Desktop ligado e com o aplicativo aberto para continuar lendo no seu celular.</em>
            </p>
          </div>
        )}
      </article>
    </section>
  );
}
