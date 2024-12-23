import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ComicChapter, Comic } from "../../../types/serie.interfaces";
import "./SeriePage.css";

export default function SeriePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  const location = useLocation();
  const { serie } = location.state as { serie: Comic };

  const totalPages = Math.ceil(serie.chapters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = serie.chapters.slice(startIndex, endIndex);

  const paginationNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <section className="serieInfo">
      <div key={serie.id} className="MainInfo">
        <figure>
          <img
            src={`data:image/png;base64,${serie.cover_image}`}
            alt={`Capa do quadrinho ${serie.name}`}
          />
          <figcaption className="infoText">
            <h1>{serie.name}</h1>
            <p>Total de capítulos: {serie.total_chapters}</p>
            <p>{serie.reading_data.last_chapter_id} - last chapter read</p>
            <p>{serie.created_at} - create date</p>
          </figcaption>
        </figure>
      </div>
      <div className="ChaptersInfo">
        <h3>Capítulos</h3>
        <ul className="chaptersLink">
          {currentItems.map((chapter) => (
            <li key={chapter.id} className="chapterName">
              {chapter.name}
            </li>
          ))}
        </ul>
        <div className="ControlBtns">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}>
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

          <button
            onClick={() =>
              setCurrentPage((next) => Math.min(next + 1, totalPages))
            }
            disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
