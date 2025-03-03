import "./Visualizer.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageControl from "../../components/PageControl/PageControl";
import VisualizerMenu from "../../components/VisualizerMenu/VisualizerMenu";
import { useGlobal } from "../../GlobalContext";

export default function Visualizer() {
  const [pageNumber, setPageNumber] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const pageRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);
  const prevPosition = useRef({ x: 0, y: 0 });

  const { serie_name, chapter_id, page } = useParams();
  const { theme } = useGlobal();
  const navigate = useNavigate();
  const loadingTime = 1;

  // Carrega o capítulo atual
  useEffect(() => {
    const getChapter = async () => {
      try {
        setLoading(true);
        const data = await window.electron.chapters.getChapter(
          serie_name,
          Number(chapter_id)
        );
        if (data) {
          setPages(data);
          setPageNumber(Number(page));
          setTimeout(() => setLoading(false), loadingTime);
        }
      } catch (error) {
        console.error(`Erro ao recuperar páginas do capítulo: ${error}`);
      }
    };

    getChapter();
  }, [serie_name, chapter_id, page]);

  // Navega para o próximo capítulo
  const nextChapter = useCallback(async () => {
    try {
      const nextChapterUrl = await window.electron.chapters.getNextChapter(
        serie_name,
        Number(chapter_id)
      );
      await window.electron.chapters.saveLastRead(
        serie_name,
        Number(chapter_id),
        pageNumber
      );
      navigate(nextChapterUrl);
    } catch (error) {
      console.error(`Erro ao navegar para o próximo capítulo: ${error}`);
    }
  }, [serie_name, chapter_id, navigate, pageNumber]);

  // Navega para o capítulo anterior
  const prevChapter = useCallback(async () => {
    try {
      const prevChapterUrl = await window.electron.chapters.getPrevChapter(
        serie_name,
        Number(chapter_id)
      );
      navigate(prevChapterUrl);
    } catch (error) {
      console.error(`Erro ao navegar para o capítulo anterior: ${error}`);
    }
  }, [serie_name, chapter_id, navigate]);

  // Avança página ou capítulo
  const nextPage = useCallback(() => {
    if (pageNumber < pages.length - 1) {
      setPageNumber((prev) => prev + 1);
    } else {
      nextChapter();
    }
  }, [pageNumber, pages.length, nextChapter]);

  // Retrocede página ou capítulo
  const prevPage = useCallback(() => {
    if (pageNumber > 0) {
      setPageNumber((prev) => prev - 1);
    } else {
      prevChapter();
    }
  }, [pageNumber, prevChapter]);

  // Handler para eventos de tecla
  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        prevPage();
      } else if (event.key === "ArrowRight") {
        nextPage();
      }
    },
    [prevPage, nextPage]
  );

  // Adiciona listener para keydown quando as páginas estão carregadas
  useEffect(() => {
    if (pages.length > 0) {
      window.addEventListener("keydown", handleKey);
    }
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [pages.length, handleKey]);

  // Realiza o download ao atingir a metade das páginas
  useEffect(() => {
    const downloadLineReading = async () => {
      if (
        pages.length > 0 &&
        pageNumber >= Math.round((pages.length - 1) / 2)
      ) {
        await window.electron.download.lineReading(
          serie_name,
          Number(chapter_id)
        );
      }
    };
    downloadLineReading();
  }, [pageNumber]);

  // Lida com eventos de mouse para o drag da imagem
  useEffect(() => {
    const image = pageRef.current;
    if (!image) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevPosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - prevPosition.current.x;
      const deltaY = e.clientY - prevPosition.current.y;
      prevPosition.current = { x: e.clientX, y: e.clientY };
      setPosition((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      resetDrag();
    };

    image.addEventListener("mousedown", handleMouseDown);
    image.addEventListener("mousemove", handleMouseMove);
    image.addEventListener("mouseup", handleMouseUp);
    image.addEventListener("mouseleave", handleMouseUp); // encerra o drag ao sair da imagem

    return () => {
      image.removeEventListener("mousedown", handleMouseDown);
      image.removeEventListener("mousemove", handleMouseMove);
      image.removeEventListener("mouseup", handleMouseUp);
      image.removeEventListener("mouseleave", handleMouseUp);
    };
  }, []);

  const resetDrag = () => {
    setPosition({ x: 0, y: 0 });
  };

  if (loading || !pages.length || !pages[pageNumber]) {
    return <p>Loading...</p>;
  }

  return (
    <section className={`visualizer ${theme ? "on" : "off"}`}>
      <VisualizerMenu
        nextChapter={nextChapter}
        setScale={setScale}
        currentPage={pageNumber}
        prevChapter={prevChapter}
      />
      <div className="containerPage">
        <img
          className="chapterPage"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          }}
          ref={pageRef}
          draggable={false}
          src={`data:image;base64,${pages[pageNumber]}`}
          alt={`Page ${pageNumber}`}
        />
      </div>
      <div className="pageControlWrapper">
        <PageControl
          currentPage={pageNumber}
          TamPages={pages.length - 1}
          nextPage={nextPage}
          prevPage={prevPage}
        />
      </div>
    </section>
  );
}
