import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  House,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  ZoomOut,
  ZoomIn,
  Book,
} from 'lucide-react';

import { visualizerProps } from '../../types/components.interfaces';
import useSerieStore from '../../store/useSerieStore';

import styles from './ViewerMenu.module.scss';

export default function ViewerMenu({
  setScale,
  nextChapter,
  prevChapter,
  currentPage,
  totalPages,
}: visualizerProps) {
  const clearSerie = useSerieStore((state) => state.clearSerie);
  const serie = useSerieStore((state) => state.serie);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    serie_name,
    chapter_id,
    chapter_name: rawChapterName,
  } = useParams<{
    serie_name: string;
    chapter_id: string;
    chapter_name: string;
  }>();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const chapter_name = decodeURIComponent(rawChapterName ?? '');

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => {
      const newState = !prev;
      if (newState) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsMenuOpen(false);
        }, 1000 * 50); // 5 seconds
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
      return newState;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prevScale) => prevScale + 0.1);
  }, [setScale]);

  const zoomOut = useCallback(() => {
    setScale((prevScale) => prevScale - 0.1);
  }, [setScale]);

  const jumpToNext = useCallback(async () => {
    await window.electronAPI.download.readingDownload(
      serie_name!,
      Number(chapter_id),
    );
    nextChapter();
  }, [serie_name, chapter_id, nextChapter]);

  const backToPrevious = useCallback(() => {
    prevChapter();
  }, [prevChapter]);

  const goHome = useCallback(
    async (totalPages: number) => {
      await window.electronAPI.chapters.saveLastRead(
        serie_name!,
        Number(chapter_id),
        currentPage,
        totalPages,
      );

      if (serie?.dataPath) {
        await window.electronAPI.series.recentSerie(
          serie.dataPath,
          serie_name!,
        );
      }

      clearSerie();
      navigate('/');
    },
    [
      serie_name,
      chapter_id,
      currentPage,
      navigate,
      clearSerie,
      serie?.dataPath,
    ],
  );

  const seriePage = useCallback(
    async (totalPages: number) => {
      await window.electronAPI.chapters.saveLastRead(
        serie_name!,
        Number(chapter_id),
        currentPage,
        totalPages,
      );

      if (serie?.dataPath) {
        const toSeriePage = await window.electronAPI.userAction.returnPage(
          serie.dataPath,
          serie_name!,
        );

        await window.electronAPI.series.recentSerie(
          serie.dataPath,
          serie_name!,
        );

        const seriePage = toSeriePage.data;

        navigate(seriePage!);
      }
    },
    [serie_name, chapter_id, currentPage, navigate, serie?.dataPath],
  );

  return (
    <article>
      <section className={`${styles.viewerMenu} ${isMenuOpen ? styles.open : styles.closed}`}>
        <button className={styles.hideMenuBtn} onClick={toggleMenu}>
          {isMenuOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
        {isMenuOpen && (
          <div className={styles.quicklyActions}>
            <span className={styles.serieTitle}>
              <Book color="#a878e5" className={styles.book} /> <p>{serie_name}</p>
            </span>
            <div className={styles.chapterControl}>
              <button onClick={backToPrevious} className={styles.jumpNextBtn}>
                <ChevronsLeft />
              </button>
              <button className={styles.choseChapterBtn}>{chapter_name}</button>
              <button onClick={jumpToNext} className={styles.jumpPrevBtn}>
                <ChevronsRight />
              </button>
            </div>
            <div className={styles.zoomControl}>
              <div className={styles.positiveZoom}>
                <button
                  id="positiveZoom"
                  onClick={zoomIn}
                  className={styles.positiveZoomBtn}
                >
                  <ZoomIn />
                </button>
              </div>
              <span className={styles.zoomDivisor}></span>
              <div className={styles.negativeZoom}>
                <button
                  id="negativeZoom"
                  className={styles.negativeZoomBtn}
                  onClick={zoomOut}
                >
                  <ZoomOut className={styles.negativeZIcon} />
                </button>
              </div>
            </div>
            <div className={styles.returnControl}>
              <label htmlFor="home">
                <button id="home" onClick={() => goHome(totalPages)}>
                  <House />
                </button>
                <span>Pagina Inicial</span>
              </label>
              <label className={styles.returnTest} htmlFor="returnPage">
                <button
                  id="seriePage"
                  onClick={() => seriePage(totalPages)}
                  className={styles.returnPageBtn}
                >
                  <ChevronLeft />
                </button>
                <span className={styles.serieName}>Voltar para {serie_name}</span>
              </label>
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
