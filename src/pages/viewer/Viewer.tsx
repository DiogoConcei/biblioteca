import { useChapterReturn } from '../../types/customHooks.interfaces';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import useChapter from '../../hooks/useChapter';
import useNavigation from '../../hooks/useNavigation';
import useDrag from '../../hooks/useDrag';
import ViewerMenu from '../../components/ViewerMenu/ViewerMenu';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import Loading from '../../components/Loading/Loading';
import PageControl from '../../components/PageControl/PageControl';
import { LoaderCircle } from 'lucide-react';
import './Viewer.scss';

export default function Viewer() {
  const {
    serie_name: rawSerieName,
    chapter_name: rawChapterName,
    chapter_id,
    page,
  } = useParams<{
    serie_name: string;
    chapter_name: string;
    chapter_id: string;
    page: string;
  }>();

  const serie_name = decodeURIComponent(rawSerieName ?? '');

  const [scale, setScale] = useState<number>(1);
  const lastCall = useRef<number>(0);

  const chapter: useChapterReturn = useChapter({
    serieName: serie_name!,
    chapterId: Number(chapter_id)!,
    page: Number(page)!,
  });

  const { position, elementRef } = useDrag(chapter);
  const chapterNavigation = useNavigation(chapter);

  useEffect(() => {
    const debounceTime = 500; // 1/2 second debounce time

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
  }, [chapterNavigation]);

  if (chapter.isLoading || !chapter.pages || chapter.isLoading) {
    return <Loading />;
  }

  if (chapter.error) {
    return <ErrorScreen error={chapter.error} serieName={chapter.serieName} />;
  }

  return (
    <section className="visualizer">
      <ViewerMenu
        currentPage={chapter.currentPage}
        nextChapter={chapterNavigation.nextChapter}
        prevChapter={chapterNavigation.prevChapter}
        setScale={setScale}
      />
      <div className="containerPage">
        <img
          className="chapterPage"
          draggable={false}
          style={{
            transform: `scale(${scale})  translate(${position.x}px, ${position.y}px)`,
          }}
          ref={elementRef}
          src={`data:image;base64,${chapter.pages[chapter.currentPage]}`}
          alt="pagina do capitulo"
        />
        {chapter.downloaded && <LoaderCircle className="spinner" />}
      </div>
      <div className="pageControlWrapper">
        <PageControl
          currentPage={chapter.currentPage}
          TamPages={chapter.quantityPages}
          nextPage={chapterNavigation.nextPage}
          prevPage={chapterNavigation.prevPage}
        />
      </div>
    </section>
  );
}
