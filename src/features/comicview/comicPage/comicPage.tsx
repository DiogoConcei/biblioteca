import { CirclePlus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useState } from 'react';

import { Comic, ComicEdition } from 'electron/types/comic.interfaces';

import useSerieStore from '../../../shared/store/useSerieStore';
import { useUIStore } from '../../../shared/store/useUIStore';
import UploadPopUp from '../../../components/UploadPopUp/UploadPopUp';
import Loading from '../../../shared/components/Loading/Loading';
import ErrorScreen from '../../../components/ErrorScreen/ErrorScreen';
import useAction from '../../../shared/hooks/useAction';
import useSerie from '../../../shared/hooks/useSerie';
import styles from './comicPage.module.scss';

export default function ComicPage() {
  const { comic_name: rawSerieName } = useParams<{ comic_name: string }>();
  const serie_name = decodeURIComponent(rawSerieName ?? '');
  useSerie(serie_name, 'Quadrinho');
  const serie = useSerieStore((state) => state.serie) as Comic;
  const chapters = useSerieStore((state) => state.chapters) as ComicEdition[];
  const error = useUIStore((state) => state.error);
  const loading = useUIStore((state) => state.loading);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { openChapter, openTieIn } = useAction();

  if (error) {
    return <ErrorScreen error={error} serieName={serie.name} />;
  }

  if (loading || !serie) {
    return <Loading />;
  }

  return (
    <section className={styles.comicGrid}>
      {chapters.map((edition, idx) => (
        <div
          key={idx}
          className={`${styles.comicCard} ${edition.isRead ? styles.read : ''}`}
          onClick={(e) => openChapter(e, edition)}
        >
          <div className={styles.ribbon}>{edition.isRead ? 'Lido' : 'Não Lido'}</div>
          <img
            className={styles.cover}
            src={`${edition.coverImage}`}
            alt={edition.name}
          />

          <div className={styles.infoOverlay}>
            <p className={styles.title}>{edition.name}</p>
          </div>
        </div>
      ))}
      {serie.childSeries
        ?.filter((tieIn) => tieIn.compiledComic === true)
        .map((tieIn) => (
          <div
            key={tieIn.id}
            className={styles.comicTieIn}
            onClick={() => openTieIn(tieIn)}
          >
            <img
              className={styles.cover}
              src={`${tieIn.coverImage}`}
              alt={tieIn.serieName}
            />
            <div className={styles.ribbon}>Tie In</div>
            <div className={styles.infoOverlay}>
              <p className={styles.title}>{tieIn.serieName}</p>
            </div>
          </div>
        ))}
      <>
        <div className={styles.addComicButton} onClick={() => setIsOpen(true)}>
          <CirclePlus size={32} stroke="#f4f4ed" />
        </div>

        <UploadPopUp isOpen={isOpen} setIsOpen={setIsOpen} literatureForm="Quadrinho" />
      </>
    </section>
  );
}
