import "./ComicVisualizer.css";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export function ComicVisualizer() {
  const [pageNumber, setPageNumber] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const { book_name, chapter_id } = useParams();

  useEffect(() => {
    const getChapter = async () => {
      try {
        const data = await window.electron.series.getChapter(
          book_name,
          Number(chapter_id)
        );
        setPages(data);
      } catch (error) {
        console.error(`erro em recuperar páginas do capitulo: ${error}`);
        throw error;
      }
    };

    getChapter();
  }, [chapter_id]);

  if (!pages || pages.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <section className="visualizer">
      <img
        className="chapterPage"
        src={`data:image/png;base64,${pages[pageNumber]}`}
        alt={`Page ${pageNumber}`}
      />
    </section>
  );
}
