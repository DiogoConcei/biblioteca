import { useEffect, useRef, useState } from 'react';
import useChapter from '../../hooks/useChapter';
import useNavigation from '../../hooks/useNavigation';
import useDrag from '../../hooks/useDrag';
import ViewerMenu from '../../components/ViewerMenu/ViewerMenu';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import Loading from '../../components/Loading/Loading';
import PageControl from '../../components/PageControl/PageControl';
import { LoaderCircle } from 'lucide-react';
import { ChapterView } from '../../types/auxiliar.interfaces';
import useUIStore from '../../store/useUIStore';
import { useParams } from 'react-router-dom';
import './Viewer.scss';

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

  if (!chapter.pages || !chapter.quantityPages) {
    return <Loading />;
  }

  if (error) {
    return <ErrorScreen error={error} serieName={chapter.serieName} />;
  }

  return (
    <section className="visualizer">
      <ViewerMenu
        currentPage={chapter.currentPage}
        nextChapter={chapterNavigation.nextChapter}
        prevChapter={chapterNavigation.prevChapter}
        totalPages={chapter.quantityPages}
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
          src={`${chapter.pages[chapter.currentPage]}`}
          alt="pagina do capitulo"
        />
        {chapter.isLoading && <LoaderCircle className="spinner" />}
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
