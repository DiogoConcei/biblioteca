import "./ComicVisualizer.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VisualizerMenu from "../../../components/VisualizerMenu/VisualizerMenu";

export function ComicVisualizer() {
  const [pageNumber, setPageNumber] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const { book_name, book_id, chapter_id } = useParams();
  const navigate = useNavigate();

  const nextPage = () => {
    if (pageNumber < pages.length - 1) {
      setPageNumber(pageNumber + 1);
    } else {
      nextChapter();
    }
  };

  const nextChapter = async () => {
    try {
      const nextChapterId = Number(chapter_id) + 1;
      if (!isNaN(nextChapterId)) {
        navigate(`/${book_name}/${book_id}/chapter/${nextChapterId}/0`);
        await window.electron.chapters.saveLastRead(
          book_name,
          Number(chapter_id),
          pageNumber
        );
        await window.electron.userAction.markRead(
          book_name,
          Number(chapter_id)
        );
      } else {
        console.error("Próximo capítulo não encontrado.");
      }
    } catch (error) {
      console.error(`Erro ao navegar para o próximo capítulo: ${error}`);
    }
  };

  const prevChapter = async () => {
    try {
      const prevChapterId = Number(chapter_id) - 1;
      if (prevChapterId >= 0) {
        navigate(`/${book_name}/${book_id}/chapter/${prevChapterId}`);
      } else {
        console.error("Capítulo anterior não encontrado.");
      }
    } catch (error) {
      console.error(`Erro ao navegar para o capítulo anterior: ${error}`);
    }
  };

  const prevPage = () => {
    if (pageNumber > 0) {
      setPageNumber(pageNumber - 1);
    } else {
      prevChapter();
    }
  };

  const handleKey = (event: KeyboardEvent) => {
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
      if (!book_name || !chapter_id) return;

      try {
        const data = await window.electron.chapters.getChapter(
          book_name,
          Number(chapter_id)
        );

        const last_page = await window.electron.chapters.getLastPage(
          book_name,
          Number(chapter_id)
        );

        if (data) {
          setPages(data);
          setPageNumber(last_page);
        }
      } catch (error) {
        console.error(`Erro ao recuperar páginas do capítulo: ${error}`);
      }
    };

    getChapter();
  }, [chapter_id]);

  useEffect(() => {
    const handleDownload = async () => {
      if (pages.length > 0) {
        window.addEventListener("keydown", handleKey);
      }

      if (
        pageNumber === Math.round((pages.length - 1) / 2) &&
        pages.length > 0
      ) {
        await window.electron.download.lineReading(
          book_name,
          Number(chapter_id)
        );
      }
    };

    handleDownload();

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [pages, pageNumber]);

  if (!pages || pages.length === 0 || !pages[pageNumber]) {
    return <p>Loading...</p>;
  }

  return (
    <section className="visualizer">
      <VisualizerMenu
        book_name={book_name}
        book_id={Number(book_id)}
        pageNumber={Number(pageNumber)}
        chapter_id={Number(chapter_id)}
      />
      <img
        className="chapterPage"
        src={`data:image/png;base64,${pages[pageNumber]}`}
        alt={`Page ${pageNumber}`}
      />
    </section>
  );
}
