import "./Visualizer.css";
import PageControl from "../../components/PageControl/PageControl";
import VisualizerMenu from "../../components/VisualizerMenu/VisualizerMenu";
import {
  useChapterReturn,
  useSimpleNavigationReturn,
} from "../../types/customHooks.interfaces";
import useDrag from "../../hooks/useDrag";
import useChapter from "../../hooks/useChapter";
import useSimpleNavigation from "../../hooks/useSimpleNavigation";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Visualizer() {
  const { serie_name, chapter_id, page } = useParams();
  const [scale, setScale] = useState<number>(1);

  const chapter: useChapterReturn = useChapter({
    serieName: serie_name,
    chapterId: chapter_id,
    page: page,
  });

  const { position, elementRef } = useDrag(chapter);

  const chapterNavigation: useSimpleNavigationReturn =
    useSimpleNavigation(chapter);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") chapterNavigation.prevPage();
      if (event.key === "ArrowRight") chapterNavigation.nextPage();
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [chapterNavigation]);

  if (chapter.error) {
    return <p>{chapter.error}</p>;
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
