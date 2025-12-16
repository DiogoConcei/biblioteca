import useSerieStore from '../../store/useSerieStore';
import useUIStore from '../../store/useUIStore';
import Loading from '../../components/Loading/Loading';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import { Comic } from 'electron/types/comic.interfaces';
import useAction from '../../hooks/useAction';
import useDownload from '../../hooks/useDownload';
import { ArrowDownToLine, ArrowDownFromLine, LoaderCircle } from 'lucide-react';
import useSerie from '../../hooks/useSerie';
import { useParams } from 'react-router-dom';
import './comicPage.scss';

export default function ComicPage() {
  const { comic_name: rawSerieName } = useParams<{ comic_name: string }>();
  const serie_name = decodeURIComponent(rawSerieName ?? '');
  useSerie(serie_name, 'Quadrinho');
  const serie = useSerieStore((state) => state.serie) as Comic;

  const error = useUIStore((state) => state.error);
  const loading = useUIStore((state) => state.loading);

  const { downloadIndividual } = useDownload();
  const { openChapter, openTieIn } = useAction();

  if (error) {
    return <ErrorScreen error={error} serieName={serie.name} />;
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
          onClick={(e) => openChapter(e, edition)}
        >
          <div className="ribbon">{edition.isRead ? 'Lido' : 'Não Lido'}</div>
          <img
            className="cover"
            src={`data:image/webp;base64,${edition.coverImage}`}
            alt={edition.name}
          />

          <div className="infoOverlay">
            <p className="title">{edition.name}</p>
            <button
              className="downloadButton"
              onClick={(e) => {
                downloadIndividual(e, edition);
              }}
            >
              {edition.isDownloaded === 'downloading' ? (
                <LoaderCircle
                  size={24}
                  strokeWidth={1}
                  className="animate-spin"
                />
              ) : edition.isDownloaded ||
                edition.isDownloaded === 'downloaded' ? (
                <ArrowDownFromLine size={24} color="#8963ba" strokeWidth={1} />
              ) : (
                <ArrowDownToLine size={24} color="#aa5042" strokeWidth={1} />
              )}
            </button>
          </div>
        </div>
      ))}
      {serie.childSeries
        ?.filter((tieIn) => tieIn.compiledComic === true)
        .map((tieIn) => (
          <div
            key={tieIn.id}
            className="comicTieIn"
            onClick={() => openTieIn(tieIn)}
          >
            <img
              className="cover"
              src={`data:image/webp;base64,${tieIn.coverImage}`}
              alt={tieIn.serieName}
            />
            <div className="ribbon">Tie In</div>
            <div className="infoOverlay">
              <p className="title">{tieIn.serieName}</p>
            </div>
          </div>
        ))}
    </section>
  );
}
