import { useState } from "react";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoCheckmarkCircle } from "react-icons/io5";
import { ChaptersInfoProps } from "../../types/components.interfaces";
import "./ChaptersInfo.css";

export default function ChaptersInfo({ serie }: ChaptersInfoProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 20;
  const totalPages = Math.ceil(serie.chapters.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = serie.chapters.slice(startIndex, endIndex);

  const paginationNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const clickPrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const clickNext = () => {
    setCurrentPage((next) => Math.min(next + 1, totalPages));
  };

  return (
    <div className="divControl">
      <h2 className="chaptersTitle">Capítulos</h2>
      <div className="chaptersLink">
        {currentItems.map((chapter) => (
          <li key={chapter.id} className="chapter">
            {chapter.name}
            {chapter.is_dowload ? (
              <IoCheckmarkCircle className="read" />
            ) : (
              <IoCheckmarkCircleOutline className="unread" />
            )}
          </li>
        ))}
      </div>

      <div className="ControlBtns">
        <button onClick={clickPrev} disabled={currentPage === 1}>
          Prev
        </button>

        {paginationNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => setCurrentPage(pageNumber)}
            className={pageNumber === currentPage ? "active" : ""}>
            {pageNumber}
          </button>
        ))}

        <button onClick={clickNext} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
