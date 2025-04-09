import "./Visualizer.css";
import { ImSpinner2 } from "react-icons/im";
import PageControl from "../../components/PageControl/PageControl";
import ErrorScreen from "../../components/ErrorScreen/ErrorScreen";
import VisualizerMenu from "../../components/VisualizerMenu/VisualizerMenu";
import {
  useChapterReturn,
  useSimpleNavigationReturn,
} from "../../types/customHooks.interfaces";
import useDrag from "../../hooks/useDrag";
import useChapter from "../../hooks/useChapter";
import useSimpleNavigation from "../../hooks/useSimpleNavigation";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export default function Visualizer() {
  const { serie_name, chapter_id, page } = useParams();
  const [scale, setScale] = useState<number>(1);
  const lastCallRef = useRef<number>(0);

  const chapter: useChapterReturn = useChapter({
    serieName: serie_name,
    chapterId: chapter_id,
    page: page,
  });

  const { position, elementRef } = useDrag(chapter);

  const chapterNavigation: useSimpleNavigationReturn =
    useSimpleNavigation(chapter);

  useEffect(() => {
    const debounceTime = 500;

    const handleKey = (event: KeyboardEvent) => {
      const now = Date.now();

      if (event.key === "ArrowLeft") {
        chapterNavigation.prevPage();
        lastCallRef.current = now;
      }

      if (event.key === "ArrowRight") {
        if (
          now - lastCallRef.current < debounceTime &&
          chapter.currentPage === chapter.quantityPages
        ) {
          return;
        }

        chapterNavigation.nextPage();
        lastCallRef.current = now;
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [chapterNavigation]);

  if (chapter.error) {
    return (
      <ErrorScreen
        error={chapter.error}
        serieName={chapter.serieName}
        dinamicRedirect=""
      />
    );
  }

  if (chapter.isLoading || !chapter.pages) {
    return <p>Loading...</p>;
  }

  return (
    <section className="visualizer">
      <VisualizerMenu
        nextChapter={chapterNavigation.nextChapter}
        prevChapter={chapterNavigation.prevChapter}
        currentPage={chapter.currentPage}
        setScale={setScale}
      />
      <div className="containerPage">
        <div className="chapterContainer">
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
          {chapter.downloaded && <ImSpinner2 className="spinner" />}
        </div>
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
