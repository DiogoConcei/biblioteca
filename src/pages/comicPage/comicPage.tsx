import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Comic, ComicTieIn } from '../../../electron/types/comic.interfaces';
import useSerie from '../../hooks/useSerie';
import { useSerieStore } from '../../store/seriesStore';
import Loading from '../../components/Loading/Loading';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import useAction from '../../hooks/useAction';
import useDownload from '../../hooks/useDownload';
import './ComicPage.scss';
import { ArrowDownToLine, ArrowDownFromLine, LoaderCircle } from 'lucide-react';

type DownloadStatus = 'not_downloaded' | 'downloading' | 'downloaded';

export default function ComicPage() {
  const { comic_name: rawChapterName } = useParams<{ comic_name: string }>();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<
    Record<number, DownloadStatus>
  >({});

  const comic_name = decodeURIComponent(rawChapterName ?? '');

  if (!comic_name) {
    return (
      <ErrorScreen
        error="Capítulo não especificado."
        serieName="Desconhecido"
      />
    );
  }

  const { serie: rawSerie, updateChapter } = useSerie(comic_name, 'Quadrinho');
  const serie = rawSerie as Comic;

  const loading = useSerieStore((state) => state.loading);
  const setLoading = useSerieStore((state) => state.setLoading);

  const { downloadIndividual } = useDownload({ setError, setDownloadStatus });
  const { openChapter } = useAction(serie?.dataPath || '');

  // const { favorites } = useCollection();
  // const orderedFavorites = useMemo(() => {
  //   return favorites
  //     ? [...favorites.series].sort((a, b) => b.rating - a.rating)
  //     : [];
  // }, [favorites]);

  const openTieIn = async (tieIn: ComicTieIn) => {
    setLoading(true);
    const response = await window.electronAPI.series.createTieIn(tieIn);

    if (!response.success) {
      console.error(response.error);
      return;
    }

    const url = response.data;

    setLoading(false);
    navigate(url!);
  };

  if (error) {
    return <ErrorScreen error={error} serieName={comic_name} />;
  }

  if (loading || !serie || !serie.chapters) {
    return <Loading />;
  }

  return (
    <section className="comicGrid">
      {serie.chapters.map((edition) => (
        <div
          key={edition.id}
          className={`comicCard ${edition.isRead ? 'read' : ''}`}
          onClick={(e) => openChapter(e, serie, edition, downloadIndividual)}
        >
          <div className="ribbon">{edition.isRead ? 'Lido' : 'Não Lido'}</div>
          <img
            className="cover"
            src={`data:image/webp;base64,${edition.coverPath}`}
            alt={edition.name}
          />

          <div className="infoOverlay">
            <p className="title">{edition.name}</p>
            <button
              className="downloadButton"
              onClick={(event) => {
                event.stopPropagation();
                downloadIndividual(
                  serie.dataPath,
                  edition.id,
                  edition,
                  updateChapter,
                  event,
                );
              }}
            >
              {downloadStatus[edition.id] === 'downloading' ? (
                <LoaderCircle
                  size={24}
                  strokeWidth={1}
                  className="animate-spin"
                />
              ) : edition.isDownload ||
                downloadStatus[edition.id] === 'downloaded' ? (
                <ArrowDownFromLine size={24} color="#8963ba" strokeWidth={1} />
              ) : (
                <ArrowDownToLine size={24} color="#aa5042" strokeWidth={1} />
              )}
            </button>
          </div>
        </div>
      ))}

      {serie.childSeries?.map((tieIn) => (
        <div
          key={tieIn.id}
          className="comicTieIn"
          onClick={() => openTieIn(tieIn)}
        >
          <img
            className="cover"
            src={`data:image/webp;base64,${tieIn.childSerieCoverPath}`}
            alt={tieIn.childSerieName}
          />
          <div className="ribbon">Tie In</div>
          <div className="infoOverlay">
            <p className="title">{tieIn.childSerieName}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
