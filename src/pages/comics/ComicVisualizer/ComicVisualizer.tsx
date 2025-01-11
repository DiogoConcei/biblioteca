import "./ComicVisualizer.css";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

export function ComicVisualizer() {
  const [pageNumber, setPageNumber] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const { book_name, chapter_id } = useParams();

  const nextPage = () => {
    if (pages && pageNumber < pages.length - 1) {
      setPageNumber(pageNumber + 1);
    }
  };

  const prevPage = () => {
    if (pages && pageNumber > 0) {
      setPageNumber(pageNumber - 1);
    }
  };

  const handleKey = (event: KeyboardEvent) => {
    if (!pages) return;
    switch (event.key) {
      case "ArrowLeft":
        prevPage();
        break;
      case "ArrowRight":
        nextPage();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const getChapter = async () => {
      try {
        const data = await window.electron.series.getChapter(
          book_name,
          Number(chapter_id)
        );
        setPages(data);
      } catch (error) {
        console.error(`Erro ao recuperar páginas do capítulo: ${error}`);
      }
    };

    getChapter();
  }, [book_name, chapter_id]);

  useEffect(() => {
    if (pages) {
      window.addEventListener("keydown", handleKey);
    }

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [pages, handleKey]);

  if (!pages) {
    return <p>Loading...</p>;
  }

  return (
    <section className="visualizer">
      <div className="actionMenu">menu</div>
      <img
        className="chapterPage"
        src={`data:image/png;base64,${pages[pageNumber]}`}
        alt={`Page ${pageNumber}`}
      />
    </section>
  );
}
