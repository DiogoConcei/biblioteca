import "./ComicVisualizer.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
        navigate(`/${book_name}/${book_id}/chapter/${nextChapterId}`);
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
        const data = await window.electron.series.getChapter(
          book_name,
          Number(chapter_id)
        );
        if (data) {
          setPages(data);
          setPageNumber(0);
        }
      } catch (error) {
        console.error(`Erro ao recuperar páginas do capítulo: ${error}`);
      }
    };

    getChapter();
  }, [chapter_id, book_name]);

  useEffect(() => {
    const handleDownload = async () => {
      if (pages.length > 0) {
        window.addEventListener("keydown", handleKey);
      }

      if (
        pageNumber === Math.round((pages.length - 1) / 2) &&
        pages.length > 0
      ) {
        console.log(pages.length / 2);
        console.log(`Chegou na metade`);
        await window.electron.download.downloadSerie(book_name, 1);
      }
    };

    handleDownload(); // Chama a função assíncrona dentro do useEffect

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [pages, pageNumber]);

  if (!pages || pages.length === 0 || !pages[pageNumber]) {
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
