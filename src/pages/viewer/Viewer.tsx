import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import useSettingsStore from '@/store/useSettingsStore';
import { getFilteredUrl } from '@/utils/imageFilters';

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
import WebtoonView from './components/WebtoonView';
import DoublePageView from './components/DoublePageView';
import SinglePageView from './components/SinglePageView';

export default function Viewer() {
  const { serie_name: rawSerieName, chapter_id } = useParams<{
    serie_name: string;
    chapter_id: string;
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

  // Memoiza a URL com filtros usando a utilidade global
  const filterUrl = useCallback(
    (url: string) => getFilteredUrl(url, settings),
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
  }, [chapterNavigation, chapter]);

  if (!chapter.pages || !chapter.quantityPages) {
    return <Loading />;
  }

  if (error) {
    return <ErrorScreen error={error} serieName={chapter.serieName} />;
  }

  const renderViewerContent = () => {
    switch (settings.readingMode) {
      case 'vertical':
        return (
          <WebtoonView
            pages={chapter.pages}
            currentPage={chapter.currentPage}
            setCurrentPage={chapter.setCurrentPage}
            nextChapter={chapterNavigation.nextChapter}
            getFilteredUrl={filterUrl}
            isWide={settings.wideScreen}
          />
        );

      case 'double':
        return (
          <DoublePageView
            pages={chapter.pages}
            currentPage={chapter.currentPage}
            getFilteredUrl={filterUrl}
          />
        );

      case 'single':
      default:
        return (
          <SinglePageView
            page={chapter.pages[chapter.currentPage]}
            currentPage={chapter.currentPage}
            getFilteredUrl={filterUrl}
            scale={scale}
            position={position}
            elementRef={elementRef}
            transitionEffect={settings.transitionEffect}
            isLoading={chapter.isLoading}
            isWide={settings.wideScreen}
          />
        );
    }
  };

  return (
    <section
      className={`${styles.visualizer} ${settings.wideScreen ? styles.wide : ''}`}
    >
      <ViewerMenu chapter={chapter} scale={scale} setScale={setScale} />

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
