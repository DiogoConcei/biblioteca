import "./ComicVisualizer.css";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VisualizerMenu from "../../../components/VisualizerMenu/VisualizerMenu";
import { useGlobal } from "../../../GlobalContext";

export default function ComicVisualizer() {
  const [pageNumber, setPageNumber] = useState(0);
  const [pages, setPages] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const pageRef = useRef(null);

  const { book_name, book_id, chapter_id, page } = useParams();
  const { theme, setTheme } = useGlobal();
  const navigate = useNavigate();
  const loadingTime = 1;

  useEffect(() => {
    const getChapter = async () => {
      try {
        setLoading(true);
        const data = await window.electron.chapters.getChapter(
          book_name,
          Number(chapter_id)
        );

        if (data) {
          setPages(data);
          setPageNumber(Number(page));

          setTimeout(() => {
            setLoading(false);
          }, loadingTime);
        }
      } catch (error) {
        console.error(`Erro ao recuperar páginas do capítulo: ${error}`);
      }
    };

    getChapter();
  }, [chapter_id, setTheme]);

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

  useEffect(() => {
    const image = pageRef.current;
    let isDraggin = false;
    let prevPosition = { x: 0, y: 0 };

    const handleMouseDown = (e: { clientX: any; clientY: any }) => {
      isDraggin = true;
      prevPosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      if (!isDraggin) return;

      const deltaX = e.clientX - prevPosition.x;
      const deltaY = e.clientY - prevPosition.y;
      prevPosition = { x: e.clientX, y: e.clientY };
      setPosition((position) => ({
        x: position.x + deltaX,
        y: position.y + deltaY,
      }));

      const handleMouseUp = () => {
        isDraggin = false;
      };

      image?.addEventListener("mousedown", handleMouseDown);
      image?.addEventListener("mousemove", handleMouseMove);
      image?.addEventListener("mouseup", handleMouseUp);

      return () => {
        image?.removeEventListener("mousedown", handleMouseDown);
        image?.removeEventListener("mousemove", handleMouseMove);
        image?.removeEventListener("mouseup", handleMouseUp);
      };
    };
  }, [scale, pageRef]);

  const nextPage = () => {
    if (pageNumber < pages.length - 1) {
      setPageNumber(pageNumber + 1);
    } else {
      nextChapter();
    }
  };

  const nextChapter = async () => {
    try {
      const nextChapterUrl = await window.electron.chapters.getNextChapter(
        book_name,
        Number(chapter_id)
      );
      await window.electron.chapters.saveLastRead(
        book_name,
        Number(chapter_id),
        pageNumber
      );
      await window.electron.userAction.markRead(book_name, Number(chapter_id));
      navigate(nextChapterUrl);
    } catch (error) {
      console.error(`Erro ao navegar para o próximo capítulo: ${error}`);
    }
  };

  const prevPage = () => {
    if (pageNumber > 0) {
      setPageNumber(pageNumber - 1);
    } else {
      prevChapter();
    }
  };

  const prevChapter = async () => {
    try {
      const prevChapterUrl = await window.electron.chapters.getPrevChapter(
        book_name,
        Number(chapter_id)
      );
      navigate(prevChapterUrl);
    } catch (error) {
      console.error(`Erro ao navegar para o capítulo anterior: ${error}`);
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

  if (loading || !pages || pages.length === 0 || !pages[pageNumber]) {
    return <p>Loading...</p>;
  }

  return (
    <section className={`visualizer  ${theme ? "on" : "off"}`}>
      <VisualizerMenu
        nextChapter={nextChapter}
        setScale={setScale}
        currentPage={pageNumber}
        prevChapter={prevChapter}
      />
      <img
        className="chapterPage"
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
        }}
        ref={pageRef}
        draggable={false}
        src={`data:image/png;base64,${pages[pageNumber]}`}
        alt={`Page ${pageNumber}`}
      />
    </section>
  );
}
