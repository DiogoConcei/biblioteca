import './Home.scss';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useSerieStore } from '../../store/seriesStore';
import Loading from '../../components/Loading/Loading';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import SearchBar from '../../components/SearchBar/SearchBar';

export default function Home() {
  const [searchInput, setSearchInput] = useState<string>('');
  const series = useSerieStore((state) => state.series);
  const navigate = useNavigate();

  const resetStates = useSerieStore((state) => state.resetStates);

  const setError = useSerieStore((state) => state.setError);
  const fetchAll = useSerieStore((state) => state.fetchSeries);
  const error = useSerieStore((state) => state.error);
  const loading = useSerieStore((state) => state.loading);

  useEffect(() => {
    const fetchData = async () => {
      await fetchAll();
    };
    fetchData();
  }, []);

  const lastChapter = async (
    e: React.MouseEvent<HTMLButtonElement | SVGElement>,
    dataPath: string,
  ) => {
    e.preventDefault();
    const response = await window.electronAPI.chapters.acessLastRead(dataPath);

    const lastChapterUrl = response.data;

    if (lastChapterUrl) {
      navigate(lastChapterUrl);
    } else {
      setError('URL do último capítulo não encontrada.');
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

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (loading || !series) {
    return <Loading />;
  }

  return (
    <section className="home" onDragOver={handleDrag} onDrop={handleDrop}>
      <SearchBar searchInput={searchInput} onSearchChange={searchChange} />

      <div className="content">
        <div className="seriesContent">
          {filteredSeries!.map((serie) => (
            <Link
              to={`${serie.literatureForm}/${serie.name}/${serie.id}`}
              onClick={resetStates}
              key={serie.id}
              className="serieLink"
            >
              <figure className="coverCard">
                <img
                  src={`data:image;base64,${serie.coverImage}`}
                  alt={`Série: ${serie.name}`}
                />
                <div className="play-action">
                  <button
                    className="playChapter"
                    aria-label={`Excluir série ${serie.name}`}
                    onClick={(e) => lastChapter(e, serie.dataPath)}
                  >
                    <Play size={'24'} />
                  </button>
                </div>
              </figure>
              <div className="serie-info">
                <p className="serie-name">{serie.name}</p>
                <div className="progress-bar">
                  <div
                    className="progress-bar-completed"
                    style={{
                      width: `${
                        (serie.chaptersRead / serie.totalChapters) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="readsInfo">
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
