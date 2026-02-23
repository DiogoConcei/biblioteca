import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useUIStore from '../../store/useUIStore';
import useSerieStore from '../../store/useSerieStore';
import useAllSeries from '../../hooks/useAllSeries';
import Loading from '../../components/Loading/Loading';
import SearchBar from '../../components/SearchBar/SearchBar';
import { ListFilter, Settings, Play, Pencil } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect/CustomSelect';
import { SerieForm } from '@/types/series.interfaces';
import styles from './Home.module.scss';
import useAction from '@/hooks/useAction';

export default function Home() {
  const [searchInput, setSearchInput] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLiteratureForm, setSelectedLiteratureForm] = useState<
    SerieForm['literatureForm'] | ''
  >('');

  const { lastChapter } = useAction();

  const loading = useUIStore((state) => state.loading);
  const clearSerie = useSerieStore((state) => state.clearSerie);
  const series = useAllSeries();
  const navigate = useNavigate();

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();

    const files = event.dataTransfer.files;
    const filePaths = Array.from(files).map((file) => {
      return window.electronAPI.webUtilities.getPathForFile(file);
    });

    try {
      const response = await window.electronAPI.upload.processSerie(filePaths);
      const serieData = response.data;
      navigate('/local-upload/serie', { state: { serieData } });
    } catch (error) {
      console.error('Erro ao carregar arquivos', error);
      throw error;
    }
  };

  const searchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setSearchInput(event.target.value);
  };

  const filteredSeries = useMemo(() => {
    return series?.filter((serie) => {
      const nomeMinusculo = serie.name.toLowerCase();
      const termoMinusculo = searchInput.toLowerCase();
      const normalizedSerieName = nomeMinusculo.replace(/\s+/g, '');
      const normalizedSearchTerm = termoMinusculo.replace(/\s+/g, '');

      const bySearch =
        termoMinusculo === '' ||
        normalizedSerieName.includes(normalizedSearchTerm);

      const byLiteratureForm =
        !selectedLiteratureForm ||
        serie.literatureForm === selectedLiteratureForm;

      return bySearch && byLiteratureForm;
    });
  }, [selectedLiteratureForm, searchInput, series]);

  if (loading || !series) {
    return <Loading />;
  }

  return (
    <section
      className={styles.home}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className={styles.content}>
        <div className={styles.options}>
          <SearchBar searchInput={searchInput} onSearchChange={searchChange} />

          <button
            onClick={() => navigate('/settings')}
            className={styles['settings-button']}
          >
            <Settings size={32} />
          </button>

          <div className={styles.filterWrapper}>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={styles.filterButton}
            >
              <ListFilter size={32} />
            </button>

            {showFilters && (
              <div className={styles.filterPanel}>
                <CustomSelect
                  label=""
                  value={selectedLiteratureForm}
                  onChange={(value) => {
                    setSelectedLiteratureForm(
                      value as SerieForm['literatureForm'] | '',
                    );
                    setShowFilters(false); // fecha ao selecionar
                  }}
                  options={[
                    { value: '', label: 'Todos os formatos' },
                    { value: 'Manga', label: 'Manga' },
                    { value: 'Quadrinho', label: 'Quadrinho' },
                    { value: 'Livro', label: 'Livro' },
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.seriesContent}>
          {filteredSeries!.map((serie) => (
            <Link
              to={`${serie.literatureForm}/${serie.name}/${serie.id}`}
              onClick={clearSerie}
              key={serie.id}
              className={styles.serieLink}
            >
              <figure className={styles.coverCard}>
                <img src={`${serie.coverImage}`} alt={`Série: ${serie.name}`} />
                <div className={styles['cover-actions']}>
                  <button
                    className={styles.editChapter}
                    aria-label={`Editar série ${serie.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(
                        `/edit/serie/${serie.name}/${serie.literatureForm}`,
                      );
                    }}
                  >
                    <Pencil size={'24'} />
                  </button>
                  <button
                    className={styles.playChapter}
                    aria-label={`Excluir série ${serie.name}`}
                    onClick={(e) => lastChapter(e, serie.id)}
                  >
                    <Play size={'24'} />
                  </button>
                </div>
              </figure>
              <div className={styles['serie-info']}>
                <p className={styles['serie-name']}>{serie.name}</p>
                <div className={styles['progress-bar']}>
                  <div
                    className={styles['progress-bar-completed']}
                    style={{
                      width: `${
                        (serie.chaptersRead / serie.totalChapters) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <span className={styles.readsInfo}>
                  <p>{serie.chaptersRead}</p>
                  <p>{serie.totalChapters}</p>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
