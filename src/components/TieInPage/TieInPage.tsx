import useSerieStore from '../../store/useSerieStore';
import useUIStore from '../../store/useUIStore';
import useAction from '../../hooks/useAction';
import useDownload from '../../hooks/useDownload';

import Loading from '../Loading/Loading';
import ErrorScreen from '../ErrorScreen/ErrorScreen';
import { TieIn } from 'electron/types/comic.interfaces';

import { ArrowDownToLine, ArrowDownFromLine, LoaderCircle } from 'lucide-react';

export default function TieInPage() {
  const serie = useSerieStore((state) => state.serie) as TieIn;
  const chaptersMap = useSerieStore((state) => state.chaptersMap);
  const chapters = Object.values(chaptersMap).sort((a, b) => a.id - b.id);
  const error = useUIStore((state) => state.error);
  const loading = useUIStore((state) => state.loading);
  const { openChapter } = useAction();
  const { downloadIndividual } = useDownload();

  if (error) {
    return <ErrorScreen error={error} serieName={serie.name} />;
  }

  if (loading || !serie || !serie.chapters) {
    return <Loading />;
  }

  return (
    <section className="comicGrid">
      {chapters.map((edition) => (
        <div
          key={edition.id}
          className={`comicCard ${edition.isRead ? 'read' : ''}`}
          onClick={(e) => openChapter(e, edition.id)}
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
                e.stopPropagation();
                downloadIndividual(edition.id, e);
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
    </section>
  );
}
