import { useState } from "react";
import { OnlySerieProp } from "../../types/components.interfaces";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoCheckmarkCircle } from "react-icons/io5";
import { MdOutlineDownload, MdFileDownload } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import Pagination from "../Pagination/Pagination";
import "./ChaptersInfo.css";

export default function ChaptersInfo({ serie }: OnlySerieProp) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(serie.chapters.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = serie.chapters.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <section className="Control">
      <h2 className="chaptersTitle">Capítulos</h2>

      <ul className="chaptersList">
        {currentItems.map((chapter) => (
          <Link
            to={`/:${serie.name}/:${serie.id}/:${chapter.name}/:${chapter.id}`}
            key={chapter.id}>
            <li className="chapter">
              <div className="filesInfo">
                <span className="chapterName">{chapter.name}</span>
                <span>
                  Upload: <FaUser />
                </span>
              </div>

              <div className="chapterExtraInfo">
                <span className="createDate">{chapter.create_date}</span>
                <div className="dataInfo">
                  {chapter.is_read ? (
                    <IoCheckmarkCircle className="read" aria-label="Lido" />
                  ) : (
                    <IoCheckmarkCircleOutline
                      className="unread"
                      aria-label="Não lido"
                    />
                  )}

                  {chapter.is_dowload ? (
                    <MdFileDownload
                      className="downloaded"
                      aria-label="Baixado"
                    />
                  ) : (
                    <MdOutlineDownload
                      className="notdownloaded"
                      aria-label="Não baixado"
                    />
                  )}
                </div>
              </div>
            </li>
          </Link>
        ))}
      </ul>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </section>
  );
}
