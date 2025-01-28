import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";
import { GoHome } from "react-icons/go";
import { FaArrowLeft } from "react-icons/fa";
import { MdLightMode } from "react-icons/md";
import { useGlobal } from "../../GlobalContext";
import { visualizerProps } from "../../types/components.interfaces";
import "./VisualizerMenu.css";

export default function VisualizerMenu({
  book_name,
  book_id,
  pageNumber,
  chapter_id,
}: visualizerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      chapter_id,
      pageNumber
    );
    navigate("/");
  };

  const seriePage = async () => {
    await window.electron.chapters.saveLastRead(
      book_name,
      chapter_id,
      pageNumber
    );
    navigate(`/${book_name}/${book_id}`);
  };

  const toggleTheme = async () => {
    let newTheme = await window.electron.AppConfig.switchTheme();
    setTheme(newTheme);
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
            <button onClick={toggleTheme}>
              <MdLightMode />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
