import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";
import { GoHome } from "react-icons/go";
import { FaArrowLeft } from "react-icons/fa";
import { MdLightMode } from "react-icons/md";
import { CiZoomIn, CiZoomOut } from "react-icons/ci";
import { useGlobal } from "../../GlobalContext";
import { GrCaretNext, GrCaretPrevious } from "react-icons/gr";
import { visualizerProps } from "../../types/components.interfaces";
import "./VisualizerMenu.css";

export default function VisualizerMenu({
  setScale,
  nextChapter,
  currentPage,
  prevChapter,
}: visualizerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { book_name, book_id, chapter_id, page } = useParams();
  const navigate = useNavigate();
  const { setTheme } = useGlobal();

  useEffect(() => {
    const getTheme = async () => {
      try {
        const theme = await window.electron.AppConfig.getThemeConfig();
        setTheme(theme);
      } catch (error) {
        throw error;
      }
    };

    getTheme();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);

    setTimeout(() => {
      setIsMenuOpen((prev) => !prev);
    }, 1000 * 10);
  };

  const goHome = async () => {
    await window.electron.chapters.saveLastRead(
      book_name,
      Number(chapter_id),
      currentPage
    );
    navigate("/");
  };

  const seriePage = async () => {
    await window.electron.chapters.saveLastRead(
      book_name,
      Number(chapter_id),
      currentPage
    );
    navigate(`/${book_name}/${book_id}`);
  };

  const toggleTheme = async () => {
    let newTheme = await window.electron.AppConfig.switchTheme();
    setTheme(newTheme);
  };

  const zoomIn = () => {
    setScale((scale) => scale + 0.1);
  };

  const zoomOut = () => {
    setScale((scale) => scale - 0.1);
  };

  const jumpToNext = async () => {
    await window.electron.download.lineReading(book_name, Number(chapter_id));
    nextChapter();
  };

  const backToPrevious = () => {
    prevChapter();
  };

  return (
    <div>
      <div className={`visualizerMenu ${isMenuOpen ? "open" : "closed"}`}>
        <button className="hideMenu" onClick={toggleMenu}>
          {isMenuOpen ? <IoMdArrowDropleft /> : <IoMdArrowDropright />}
        </button>
        {isMenuOpen && (
          <div className="quicklyActions">
            <button onClick={goHome}>
              <GoHome />
            </button>
            <button onClick={seriePage}>
              <FaArrowLeft />
            </button>
            <button onClick={jumpToNext}>
              <GrCaretNext />
            </button>
            <button onClick={zoomIn}>
              <CiZoomIn />
            </button>
            <button onClick={zoomOut}>
              <CiZoomOut />
            </button>
            <button onClick={backToPrevious}>
              <GrCaretPrevious />
            </button>
            <button onClick={toggleTheme}>
              <MdLightMode />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
