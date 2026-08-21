import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import useSettingsStore from '@/shared/store/useSettingsStore';

import { ChapterView } from '../../../../electron/types/electron-auxiliar.interfaces';
import ViewerMenu from '../../../components/ViewerMenu/ViewerMenu';
import ErrorScreen from '../../../components/ErrorScreen/ErrorScreen';
import Loading from '../../../shared/components/Loading/Loading';
import PageControl from '../../../components/PageControl/PageControl';
import useChapter from '../../../shared/hooks/useChapter';
import useDrag from '../../../shared/hooks/useDrag';
import useNavigation from '../../../shared/hooks/useNavigation';
import { useUIStore } from '../../../shared/store/useUIStore';
import styles from './Viewer.module.scss';
import SinglePageView from './components/SinglePageView';

export default function Viewer() {
  const { serie_name: rawSerieName, chapter_id } = useParams<{
    serie_name: string;
    chapter_id: string;
  }>();

  const decode_serie_name = decodeURIComponent(rawSerieName ?? '');

  const chapter: ChapterView = useChapter(decode_serie_name, Number(chapter_id));

  const { position, elementRef } = useDrag(chapter);
  const chapterNavigation = useNavigation(chapter);
  const [scale, setScale] = useState<number>(1);
  const lastCall = useRef<number>(0);
  const error = useUIStore((state) => state.error);

  const settings = useSettingsStore((state) => state.settings.viewer);

  const filterUrl = useCallback((url: string) => url, []);

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
    return (
      <SinglePageView
        page={chapter.pages[chapter.currentPage]}
        currentPage={chapter.currentPage}
        getFilteredUrl={filterUrl}
        scale={scale}
        position={position}
        elementRef={elementRef}
        transitionEffect={'none'}
        isLoading={chapter.isLoading}
        isWide={false}
      />
    );
  };

  return (
    <section className={styles.visualizer}>
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
          {`${chapter.currentPage + 1} / ${chapter.quantityPages}`}
        </div>
      )}
    </section>
  );
}
