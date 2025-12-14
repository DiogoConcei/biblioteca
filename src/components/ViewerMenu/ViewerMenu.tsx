import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { visualizerProps } from '../../types/components.interfaces';
import useSerieStore from '../../store/useSerieStore';
import './ViewerMenu.scss';
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

export default function ViewerMenu({
  setScale,
  nextChapter,
  prevChapter,
  currentPage,
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

  const goHome = useCallback(async () => {
    await window.electronAPI.chapters.saveLastRead(
      serie_name!,
      Number(chapter_id),
      currentPage,
    );

    await window.electronAPI.series.recentSerie(serie?.dataPath!, serie_name!);

    clearSerie();
    navigate('/');
  }, [serie_name, chapter_id, currentPage, navigate]);

  const seriePage = useCallback(async () => {
    await window.electronAPI.chapters.saveLastRead(
      serie_name!,
      Number(chapter_id),
      currentPage,
    );

    const toSeriePage = await window.electronAPI.userAction.returnPage(
      serie_name!,
      serie?.dataPath!,
    );

    await window.electronAPI.series.recentSerie(serie?.dataPath!, serie_name!);

    const seriePage = toSeriePage.data;

    navigate(seriePage!);
  }, [serie_name, chapter_id, currentPage, navigate]);

  return (
    <article>
      <section className={`viewer-menu ${isMenuOpen ? 'open' : 'closed'}`}>
        <button className="hideMenuBtn" onClick={toggleMenu}>
          {isMenuOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
        {isMenuOpen && (
          <div className="quicklyActions">
            <span className="serieTitle">
              <Book color="#a878e5" className="book" /> <p>{serie_name}</p>
            </span>
            <div className="chapterControl">
              <button onClick={backToPrevious} className="jumpNextBtn">
                <ChevronsLeft />
              </button>
              <button className="choseChapterBtn">{chapter_name}</button>
              <button onClick={jumpToNext} className="jumpPrevBtn">
                <ChevronsRight />
              </button>
            </div>
            <div className="zoomControl">
              <div className="positiveZoom">
                <button
                  id="positiveZoom"
                  onClick={zoomIn}
                  className="positiveZoomBtn"
                >
                  <ZoomIn />
                </button>
              </div>
              <span className="zoomDivisor"></span>
              <div className="negativeZoom">
                <button
                  id="negativeZoom"
                  className="negativeZoomBtn"
                  onClick={zoomOut}
                >
                  <ZoomOut className="negativeZIcon" />
                </button>
              </div>
            </div>
            <div className="returnControl">
              <label htmlFor="home">
                <button id="home" onClick={goHome}>
                  <House />
                </button>
                <span>Pagina Inicial</span>
              </label>
              <label className="returnTest" htmlFor="returnPage">
                <button
                  id="seriePage"
                  onClick={seriePage}
                  className="returnPageBtn"
                >
                  <ChevronLeft />
                </button>
                <span className="serieName">Voltar para {serie_name}</span>
              </label>
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
