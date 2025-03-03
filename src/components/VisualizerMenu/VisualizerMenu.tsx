import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";
import { FaBookReader, FaArrowLeft } from "react-icons/fa";
import { CiZoomIn, CiZoomOut } from "react-icons/ci";
import { GrCaretNext, GrCaretPrevious } from "react-icons/gr";
import { GoHome } from "react-icons/go";
import { visualizerProps } from "../../types/components.interfaces";
import "./VisualizerMenu.css";

export default function VisualizerMenu({
  setScale,
  nextChapter,
  prevChapter,
  currentPage,
}: visualizerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { serie_name, chapter_id, chapter_name } = useParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => {
      const newState = !prev;
      if (newState) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsMenuOpen(false);
        }, 60000);
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
      return newState;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prevScale) => prevScale + 0.1);
  }, [setScale]);

  const zoomOut = useCallback(() => {
    setScale((prevScale) => prevScale - 0.1);
  }, [setScale]);

  const jumpToNext = useCallback(async () => {
    await window.electron.download.lineReading(serie_name, Number(chapter_id));
    nextChapter();
  }, [serie_name, chapter_id, nextChapter]);

  const backToPrevious = useCallback(() => {
    prevChapter();
  }, [prevChapter]);

  const goHome = useCallback(async () => {
    await window.electron.chapters.saveLastRead(
      serie_name,
      Number(chapter_id),
      currentPage
    );
    navigate("/");
  }, [serie_name, chapter_id, currentPage, navigate]);

  const seriePage = useCallback(async () => {
    await window.electron.chapters.saveLastRead(
      serie_name,
      Number(chapter_id),
      currentPage
    );
    const toSeriePage = await window.electron.userAction.returnPage(serie_name);
    navigate(toSeriePage);
  }, [serie_name, chapter_id, currentPage, navigate]);

  return (
    <article>
      <section className={`visualizerMenu ${isMenuOpen ? "open" : "closed"}`}>
        <button className="hideMenuBtn" onClick={toggleMenu}>
          {isMenuOpen ? (
            <IoMdArrowDropleft className="arrowOpen" />
          ) : (
            <IoMdArrowDropright className="arrowClosed" />
          )}
        </button>
        {isMenuOpen && (
          <div className="quicklyActions">
            <span className="serieTitle">
              <FaBookReader className="readerIcon" /> <p>{serie_name}</p>
            </span>
            <div className="chapterControl">
              <button onClick={jumpToNext} className="jumpNextBtn">
                <GrCaretNext />
              </button>
              <button className="choseChapterBtn">{chapter_name}</button>
              <button onClick={backToPrevious} className="jumpPrevBtn">
                <GrCaretPrevious />
              </button>
            </div>
            <div className="actionBtns">
              <div className="zoomControl">
                <div className="positiveZoom">
                  <label htmlFor="positiveZoom">Aumentar o zoom</label>
                  <button
                    id="positiveZoom"
                    onClick={zoomIn}
                    className="positiveZoomBtn"
                  >
                    <CiZoomIn />
                  </button>
                </div>
                <span className="zoomDivisor"></span>
                <div className="negativeZoom">
                  <button
                    id="negativeZoom"
                    className="negativeZoomBtn"
                    onClick={zoomOut}
                  >
                    <CiZoomOut className="negativeZIcon" />
                  </button>
                  <label htmlFor="negativeZoom">Diminuir o zoom</label>
                </div>
              </div>
            </div>
            <span className="returnDivisor"></span>
            <div className="returnControl">
              <label htmlFor="home">
                <button id="home" onClick={goHome} className="returnHomeBtn">
                  <GoHome className="homeBtn" />
                </button>
                Pagina Inicial
              </label>
              <label htmlFor="seriePage">
                <button
                  id="seriePage"
                  onClick={seriePage}
                  className="returnPageBtn"
                >
                  <FaArrowLeft className="returnPageIcon" />
                </button>
                Voltar para {serie_name}
              </label>
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
