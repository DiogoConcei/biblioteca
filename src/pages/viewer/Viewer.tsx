import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';

import useSettingsStore from '@/store/useSettingsStore';

import { ChapterView } from '../../../electron/types/electron-auxiliar.interfaces';
import ViewerMenu from '../../components/ViewerMenu/ViewerMenu';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import Loading from '../../components/Loading/Loading';
import PageControl from '../../components/PageControl/PageControl';
import useChapter from '../../hooks/useChapter';
import useDrag from '../../hooks/useDrag';
import useNavigation from '../../hooks/useNavigation';
import { useUIStore } from '../../store/useUIStore';
import styles from './Viewer.module.scss';

export default function Viewer() {
  const { serie_name: rawSerieName, chapter_id } = useParams<{
    serie_name: string;
    chapter_id: string;
    LiteratureForm: string;
  }>();
  const decode_serie_name = decodeURIComponent(rawSerieName ?? '');

  const chapter: ChapterView = useChapter(
    decode_serie_name,
    Number(chapter_id),
  );
  const { position, elementRef } = useDrag(chapter);
  const chapterNavigation = useNavigation(chapter);
  const [scale, setScale] = useState<number>(1);
  const lastCall = useRef<number>(0);
  const error = useUIStore((state) => state.error);
  
  const settings = useSettingsStore((state) => state.settings.viewer);

  // Intersection Observer para o modo Webtoon
  useEffect(() => {
    if (settings.readingMode !== 'webtoon' || !chapter.pages) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3, // 30% da página visível para disparar
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageIndex = Number(entry.target.getAttribute('data-page-index'));
          if (!isNaN(pageIndex) && pageIndex !== chapter.currentPage) {
            chapter.setCurrentPage(pageIndex);
          }
        }
      });
    }, observerOptions);

    // Observa todas as imagens do webtoon
    const images = document.querySelectorAll(`.${styles.webtoonPage}`);
    images.forEach((img) => observer.observe(img));

    return () => observer.disconnect();
  }, [settings.readingMode, chapter.pages, chapter.currentPage, chapter]);

  // Memoiza a URL com filtros para evitar recalculação constante
  const getFilteredUrl = useMemo(
    () => (url: string) => {
      if (!url) return '';

      const params = [];
      if (settings.brightness !== 1)
        params.push(`brightness=${settings.brightness}`);
      if (settings.contrast !== 1)
        params.push(`contrast=${settings.contrast}`);
      if (settings.grayscale) params.push(`grayscale=true`);
      if (settings.sharpness > 0) params.push(`sharpness=${settings.sharpness}`);

      if (params.length === 0) return url;

      const connector = url.includes('?') ? '&' : '?';
      return `${url}${connector}${params.join('&')}`;
    },
    [settings],
  );

  useEffect(() => {
    const debounceTime = 500;

    const handleKey = (event: KeyboardEvent) => {
      const now = Date.now();

      if (event.key === 'ArrowLeft') {
        chapterNavigation.prevPage();
        lastCall.current = now;
      }

      if (event.key === 'ArrowRight') {
        if (
          now - lastCall.current < debounceTime &&
          chapter.currentPage === chapter.quantityPages
        ) {
          return;
        }

        chapterNavigation.nextPage();
        lastCall.current = now;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [chapterNavigation, chapter, settings.readingMode]);

  if (!chapter.pages || !chapter.quantityPages) {
    return <Loading />;
  }

  if (error) {
    return <ErrorScreen error={error} serieName={chapter.serieName} />;
  }

  const renderViewerContent = () => {
    switch (settings.readingMode) {
      case 'webtoon':
        return (
          <div className={styles.webtoonContainer}>
            {chapter.pages.map((page: string, index: number) => (
              <img
                key={index}
                data-page-index={index}
                src={getFilteredUrl(page)}
                alt={`Página ${index + 1}`}
                className={styles.webtoonPage}
                loading="lazy"
                decoding="async"
              />
            ))}
            <div className={styles.webtoonEnd}>
               <button onClick={chapterNavigation.nextChapter}>Próximo Capítulo</button>
            </div>
          </div>
        );

      case 'double': {
        const secondPageIdx = chapter.currentPage + 1;
        const hasSecondPage = secondPageIdx < chapter.pages.length;
        
        return (
          <div className={styles.doublePageContainer}>
            <div className={styles.doublePageWrapper}>
               <img
                  className={styles.doublePageImage}
                  src={getFilteredUrl(chapter.pages[chapter.currentPage])}
                  alt="página esquerda"
               />
               {hasSecondPage && (
                  <img
                    className={styles.doublePageImage}
                    src={getFilteredUrl(chapter.pages[secondPageIdx])}
                    alt="página direita"
                  />
               )}
            </div>
          </div>
        );
      }

      case 'single':
      default:
        return (
          <div className={styles.containerPage}>
            <img
              key={chapter.currentPage} // Força re-render para animação de transição
              className={`${styles.chapterPage} ${styles[settings.transitionEffect] || ''}`}
              draggable={false}
              style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              }}
              ref={elementRef}
              src={getFilteredUrl(chapter.pages[chapter.currentPage])}
              alt={`Página ${chapter.currentPage + 1}`}
            />
            {chapter.isLoading && <LoaderCircle className={styles.spinner} />}
          </div>
        );
    }
  };

  return (
    <section className={`${styles.visualizer} ${settings.wideScreen ? styles.wide : ''}`}>
      <ViewerMenu
        chapter={chapter}
        setScale={setScale}
      />
      
      {renderViewerContent()}

      <div className={styles.pageControlWrapper}>
        <PageControl
          currentPage={chapter.currentPage}
          TamPages={chapter.quantityPages}
          nextPage={chapterNavigation.nextPage}
          prevPage={chapterNavigation.prevPage}
        />
      </div>
      
      {settings.showPageNumbers && (
        <div className={styles.pageIndicator}>
          {settings.readingMode === 'double'
            ? `${chapter.currentPage + 1}-${Math.min(
                chapter.currentPage + 2,
                chapter.quantityPages,
              )} / ${chapter.quantityPages}`
            : `${chapter.currentPage + 1} / ${chapter.quantityPages}`}
        </div>
      )}
    </section>
  );
}
