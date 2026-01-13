import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useUIStore from '../../store/useUIStore';
import useSerieStore from '../../store/useSerieStore';
import useAllSeries from '../../hooks/useAllSeries';
import Loading from '../../components/Loading/Loading';
import SearchBar from '../../components/SearchBar/SearchBar';
import { Play, Pencil } from 'lucide-react';
import { viewData } from '../../../electron/types/electron-auxiliar.interfaces';
import styles from './Home.module.scss';

export default function Home() {
  const [searchInput, setSearchInput] = useState<string>('');
  const setError = useUIStore((state) => state.setError);
  const setSerie = useSerieStore((state) => state.setSerie);

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

    console.log(filePaths);

    try {
      const response = await window.electronAPI.upload.processSerie(filePaths);
      const serieData = response.data;
      console.log(serieData);
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

  const filteredSeries = series?.filter((serie) => {
    const nomeMinusculo = serie.name.toLowerCase();
    const termoMinusculo = searchInput.toLowerCase();

    const normalizedSerieName = nomeMinusculo.replace(/\s+/g, '');
    const normalizedSearchTerm = termoMinusculo.replace(/\s+/g, '');

    return (
      termoMinusculo === '' ||
      normalizedSerieName.includes(normalizedSearchTerm)
    );
  });

  const lastChapter = async (
    e: React.MouseEvent<HTMLButtonElement | SVGElement>,
    serie: viewData,
  ) => {
    e.preventDefault();

    const response = await window.electronAPI.chapters.acessLastRead(
      serie.dataPath,
    );

    if (!response.success || !response.data)
      return setError(`${response.error}`);

    const lastChapterUrl = response.data[0];
    const serieData = response.data[1];
    setSerie(serieData);

    if (lastChapterUrl) {
      navigate(lastChapterUrl);
    } else {
      setError('URL do último capítulo não encontrada.');
    }
  };

  if (loading || !series) {
    return <Loading />;
  }

  return (
    <section
      className={styles.home}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <SearchBar searchInput={searchInput} onSearchChange={searchChange} />

      <div className={styles.content}>
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
                    onClick={(e) => lastChapter(e, serie)}
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
