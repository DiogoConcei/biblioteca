import { useState, useEffect } from 'react';
import {
  SortAsc,
  ArrowUp,
  ArrowDown,
  Save,
  Globe,
} from 'lucide-react';

import useAllSeries from '@/hooks/useAllSeries';
import SeriesView from '@/components/SeriesView/SeriesView';
import { LiteratureChapter } from '@/../electron/types/electron-auxiliar.interfaces';

import styles from './SystemConfig.module.scss';

export default function SystemConfig() {
  const allSeries = useAllSeries();

  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

  // Estados para reordenação e ações
  const [selectedSeriePath, setSelectedSeriePath] = useState('');
  const [chapters, setChapters] = useState<LiteratureChapter[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Efeito para sincronizar a seleção do grid (SeriesView) com o dropdown e dados de reordenação
  useEffect(() => {
    if (selectedId != null) {
      const selectedSerie = allSeries?.find((s) => s.id === selectedId);
      if (
        selectedSerie &&
        (selectedSerie.literatureForm === 'Manga' || selectedSerie.literatureForm === 'Quadrinho')
      ) {
        // Apenas carrega os capítulos se a série selecionada for diferente da atual
        if (selectedSerie.dataPath !== selectedSeriePath) {
          handleSelectSerie(selectedSerie.dataPath);
        }
      }
    }
  }, [selectedId, allSeries]);

  const handleSelectSerie = async (dataPath: string) => {
    setSelectedSeriePath(dataPath);
    if (!dataPath) {
      setChapters([]);
      setSelectedId(undefined);
      return;
    }

    const serie = allSeries?.find((s) => s.dataPath === dataPath);
    if (!serie) return;

    // Sincroniza o ID selecionado no grid
    setSelectedId(serie.id);

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

  const handleFetchMetadata = async () => {
    if (!selectedSeriePath) return;
    const serie = allSeries?.find((s) => s.dataPath === selectedSeriePath);
    if (!serie) return;

    setIsFetchingMetadata(true);
    try {
      const type = serie.literatureForm === 'Manga' ? 'manga' : 'comic';
      const response = await window.electronAPI.collections.fetchMetadata(
        serie.name,
        type
      );

      if (response.success && response.data) {
        alert(
          `Metadados encontrados!\n\nTítulo: ${response.data.title}\nAutor: ${response.data.authors?.join(', ') || 'N/A'}\nDescrição: ${response.data.description.slice(0, 300)}...`
        );
      } else {
        alert('Nenhum metadado online encontrado para esta série.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao buscar metadados online.');
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const reorderableSeries = allSeries?.filter(
    (s) => s.literatureForm === 'Manga' || s.literatureForm === 'Quadrinho'
  ) || [];

  return (
    <section className={styles.card}>
      <SeriesView
        series={allSeries}
        title="Séries Cadastradas"
        selectedId={selectedId}
        onSelect={(serie) => setSelectedId(serie.id)}
      />

      <section className={styles.reorderSection}>
        <h2>
          <SortAsc size={24} /> Ações Rápidas de Série
        </h2>
        <p>
          Selecione uma série no grid ou no menu abaixo para realizar ações de reordenação ou consulta de metadados.
        </p>

        <div className={styles.seriesSelectorRow}>
          <select
            className={styles.serieSelect}
            value={selectedSeriePath}
            onChange={(e) => handleSelectSerie(e.target.value)}
          >
            <option value="">Selecione uma Série...</option>
            {reorderableSeries.map((serie) => (
              <option key={serie.id} value={serie.dataPath}>
                {serie.name} ({serie.literatureForm === 'Manga' ? 'Mangá' : 'Quadrinho'})
              </option>
            ))}
          </select>

          {selectedSeriePath && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleFetchMetadata}
              disabled={isFetchingMetadata}
            >
              <Globe size={16} /> {isFetchingMetadata ? 'Buscando...' : 'Buscar Dados Online'}
            </button>
          )}
        </div>

        {chapters.length > 0 && (
          <div className={styles.reorderContainer}>
            <h3>Reordenação de Capítulos</h3>
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
          </div>
        )}
      </section>
    </section>
  );
}

