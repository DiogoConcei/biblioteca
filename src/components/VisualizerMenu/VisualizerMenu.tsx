import { useState } from "react";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";
import { visualizerProps } from "../../types/components.interfaces";
import { GoHome } from "react-icons/go";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./VisualizerMenu.css";

export default function VisualizerMenu({
  book_name,
  book_id,
  pageNumber,
  chapter_id,
}: visualizerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
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

  return (
    <div>
      <div className={`visualizerMenu ${isMenuOpen ? "open" : "closed"}`}>
        <button className="hideMenu" onClick={toggleMenu}>
          {isMenuOpen ? <IoMdArrowDropleft /> : <IoMdArrowDropright />}
        </button>
        {isMenuOpen && (
          <div className="quicklyActions">
            <button onClick={() => goHome()}>
              <GoHome />
            </button>
            <button onClick={() => seriePage()}>
              <FaArrowLeft />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
