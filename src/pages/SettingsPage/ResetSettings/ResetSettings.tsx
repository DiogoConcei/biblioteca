import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  RefreshCw,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  SortAsc,
  Save,
  Download,
} from 'lucide-react';

import useSystem from '@/hooks/useSystem';
import useAllSeries from '@/hooks/useAllSeries';
import {
  LiteratureChapter,
  viewData,
} from '@/../electron/types/electron-auxiliar.interfaces';

import styles from './ResetSettings.module.scss';

export default function ResetSettings() {
  const systemManager = useSystem();
  const allSeries = useAllSeries();

  const [showFullResetModal, setShowFullResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Estados para reordenação
  const [selectedSeriePath, setSelectedSeriePath] = useState('');
  const [chapters, setChapters] = useState<LiteratureChapter[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Estado para séries baixadas
  const [downloadedSeries, setDownloadedSeries] = useState<viewData[]>([]);

  useEffect(() => {
    const fetchDownloadedSeries = async () => {
      try {
        const response = await window.electronAPI.system.getSeriesWithDownloads();
        if (response.success && response.data) {
          setDownloadedSeries(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar séries com download:', error);
      }
    };

    fetchDownloadedSeries();
  }, []);

  const handleSoftReset = async () => {
    if (!window.confirm('Deseja limpar os logs e arquivos temporários?')) return;

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

  const handleSelectSerie = async (dataPath: string) => {
    setSelectedSeriePath(dataPath);
    if (!dataPath) {
      setChapters([]);
      return;
    }

    const serie = allSeries?.find((s) => s.dataPath === dataPath);
    if (!serie) return;

    try {
      const response = await window.electronAPI.series.getSerie(
        serie.name,
        serie.literatureForm,
      );
      if (response.success && response.data) {
        setChapters(response.data.chapters || []);
      }
    } catch (error) {
      console.error('Erro ao buscar capítulos:', error);
    }
  };

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const newChapters = [...chapters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newChapters.length) return;

    [newChapters[index], newChapters[targetIndex]] = [
      newChapters[targetIndex],
      newChapters[index],
    ];
    setChapters(newChapters);
  };

  const autoSortChapters = () => {
    const sorted = [...chapters].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
    setChapters(sorted);
  };

  const handleSaveOrder = async () => {
    if (!selectedSeriePath || chapters.length === 0) return;

    setIsSavingOrder(true);
    try {
      const chapterIds = chapters.map((c) => c.id);
      const response = await window.electronAPI.chapters.reorderChapters(
        selectedSeriePath,
        chapterIds,
      );

      if (response.success) {

        alert('Ordem dos capítulos salva com sucesso!');
      } else {
        alert('Erro ao salvar ordem: ' + response.error);
      }
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      alert('Falha ao salvar a nova ordem.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const mangaSeries = allSeries?.filter((s) => s.literatureForm === 'Manga') || [];

  return (
    <div className={styles.container}>
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

      <section className={styles.reorderSection}>
        <h2>
          <SortAsc size={24} /> Reordenação de Capítulos (Mangás)
        </h2>
        <p>
          Se os capítulos estiverem fora de ordem, use esta ferramenta para
          corrigir a sequência.
        </p>

        <select
          className={styles.serieSelect}
          value={selectedSeriePath}
          onChange={(e) => handleSelectSerie(e.target.value)}
        >
          <option value="">Selecione um Mangá...</option>
          {mangaSeries.map((serie) => (
            <option key={serie.id} value={serie.dataPath}>
              {serie.name}
            </option>
          ))}
        </select>

        {chapters.length > 0 && (
          <>
            <div className={styles.chapterList}>
              {chapters.map((chapter, index) => (
                <div key={`${chapter.id}-${index}`} className={styles.chapterItem}>
                  <span>{chapter.name}</span>
                  <div className={styles.chapterActions}>
                    <button
                      title="Subir"
                      onClick={() => moveChapter(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      title="Descer"
                      onClick={() => moveChapter(index, 'down')}
                      disabled={index === chapters.length - 1}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.mainActions}>
              <button className={styles.primary} onClick={autoSortChapters}>
                <SortAsc size={16} /> Ordenar Automaticamente
              </button>
              <button
                className={styles.primary}
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
              >
                <Save size={16} /> {isSavingOrder ? 'Salvando...' : 'Salvar Nova Ordem'}
              </button>
            </div>
          </>
        )}
      </section>

      <section className={styles.downloadSection}>
        <h2>
          <Download size={24} /> Séries com Download
        </h2>
        <p>
          Estas são as séries que possuem conteúdo baixado localmente em seu dispositivo.
        </p>

        {downloadedSeries.length > 0 ? (
          <div className={styles.coverGrid}>
            {downloadedSeries.map((serie) => (
              <div key={serie.id} className={styles.coverItem}>
                <img src={serie.coverImage} alt={serie.name} title={serie.name} />
                <span className={styles.coverLabel}>{serie.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyMessage}>Nenhuma série com download encontrada.</p>
        )}
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
              configurações e biblioteca local) para a <strong>Lixeira</strong> do 
              seu sistema.
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
