import { useEffect, useState } from 'react';

import styles from './LanSettings.module.scss';
import { LanStatus } from '../../../../electron/types/electron-auxiliar.interfaces';

export default function LanSettings() {
  const [lanStatus, setLanStatus] = useState<LanStatus>({ 
    active: false, url: '', token: '', qrCode: '' 
  });
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
        if (res.success) setLanStatus({ active: res.active, url: res.url, token: res.token, qrCode: res.qrCode });
        else setErrorLog(res.error || 'Erro desconhecido ao parar o servidor.');
      } else {
        const res = await window.electronAPI.lan.start();
        if (res.success) setLanStatus({ active: res.active, url: res.url, token: res.token, qrCode: res.qrCode });
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
            <div className={styles.lanContainer}>
              <div className={styles.lanInfo}>
                <p>
                  <strong>Acesse no celular: </strong>
                  <a href={lanStatus.url} target="_blank" rel="noreferrer" className={styles.link}>
                    {lanStatus.url}
                  </a>
                </p>
                <p>
                  <strong>Hostname: </strong>
                  <code>http://{lanStatus.hostname || 'biblioteca'}.local:3030</code>
                </p>
                <p>
                  <strong>Token de Sessão: </strong>
                  <code>{lanStatus.token}</code>
                </p>
                <p className={styles.warningInfo}>
                  <em>Aponte a câmera do celular para o QR Code ao lado para conectar instantaneamente.</em>
                </p>
              </div>
              
              {lanStatus.qrCode && (
                <div className={styles.qrCodeContainer}>
                  <img src={lanStatus.qrCode} alt="QR Code de conexão LAN" />
                </div>
              )}
            </div>
            
            <p className={styles.warningInfo}>
              <em>Mantenha o Desktop ligado e com o aplicativo aberto para continuar lendo no seu celular.</em>
            </p>
          </div>
        )}
      </article>
    </section>
  );
}
