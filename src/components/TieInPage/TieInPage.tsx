import { useParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowDownFromLine, LoaderCircle } from 'lucide-react';

import { ComicEdition, TieIn } from 'electron/types/comic.interfaces';

import useSerieStore from '../../store/useSerieStore';
import { useUIStore } from '../../store/useUIStore';
import useAction from '../../hooks/useAction';
import useDownload from '../../hooks/useDownload';
import useSerie from '../../hooks/useSerie';
import Loading from '../Loading/Loading';
import ErrorScreen from '../ErrorScreen/ErrorScreen';
import styles from '../../pages/comicPage/comicPage.module.scss';

export default function TieInPage() {
  const { tiein_name: rawSerieName } = useParams<{ tiein_name: string }>();
  const serie_name = decodeURIComponent(rawSerieName ?? '');
  useSerie(serie_name, 'childSeries');
  const serie = useSerieStore((state) => state.serie) as TieIn;
  const chapters = useSerieStore((state) => state.chapters) as ComicEdition[];

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
    <section className={styles.comicGrid}>
      {chapters.map((edition) => (
        <div
          key={edition.id}
          className={`${styles.comicCard} ${edition.isRead ? styles.read : ''}`}
          onClick={(e) => openChapter(e, edition)}
        >
          <div className={styles.ribbon}>
            {edition.isRead ? 'Lido' : 'Não Lido'}
          </div>
          <img
            className={styles.cover}
            src={`${edition.coverImage}`}
            alt={edition.name}
          />

          <div className={styles.infoOverlay}>
            <p className={styles.title}>{edition.name}</p>
            <p>{edition.isDownloaded}</p>
            <button
              className={styles.downloadButton}
              onClick={(e) => {
                e.stopPropagation();
                downloadIndividual(e, edition);
              }}
            >
              {edition.isDownloaded === 'downloading' ? (
                <LoaderCircle
                  size={24}
                  strokeWidth={1}
                  className={styles['animate-spin']}
                />
              ) : edition.isDownloaded === 'downloaded' ? (
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
