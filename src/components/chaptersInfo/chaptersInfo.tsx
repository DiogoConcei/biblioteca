import { useState } from "react";
import { OnlySerieProp } from "../../types/components.interfaces";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoCheckmarkCircle } from "react-icons/io5";
import { MdOutlineDownload, MdFileDownload, MdUpload } from "react-icons/md";
import { PiSortDescendingThin, PiSortAscendingThin } from "react-icons/pi";
import { FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import { MangaChapter } from "../../types/manga.interfaces";
import Pagination from "../Pagination/Pagination";
import "./ChaptersInfo.css";

export default function ChaptersInfo({ manga }: OnlySerieProp) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isAscendig, setAscending] = useState<boolean>(false);
  const [chapters, setChapters] = useState<MangaChapter[]>(manga.chapters);
  const itemsPerPage = 11;
  const totalPages = Math.ceil(manga.chapters.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = chapters.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const changeOrder = () => {
    const sortedChapters = [...chapters].sort((a, b) => {
      const numA = parseFloat(a.name.split(" ")[1]);
      const numB = parseFloat(b.name.split(" ")[1]);

      if (isAscendig) {
        return numA - numB;
      } else {
        return numB - numA;
      }
    });

    setChapters(sortedChapters);
    setAscending(!isAscendig);
  };

  const markAsRead = async (
    event: React.MouseEvent<HTMLButtonElement>,
    serieName: string,
    chapter_id: number
  ) => {
    event.preventDefault();
    await window.electron.userAction.markRead(manga.name, chapter_id);
  };

  const downloadIndividual = async (
    event: React.MouseEvent<HTMLButtonElement>,
    serieName: string,
    chapter_id: number
  ) => {
    event.preventDefault();
    await window.electron.download.downloadIndividual(serieName, chapter_id);
  };

  return (
    <section className="Control">
      <div className="chaptersTitle">
        <h2>Capítulos</h2>
        <div>
          <span className="orderChapters" onClick={(e) => changeOrder()}>
            {isAscendig ? (
              <PiSortAscendingThin className="asc" />
            ) : (
              <PiSortDescendingThin className="desc" />
            )}
          </span>
          <span className="uploadNewChapters">
            <MdUpload className="uploadBtn" />
          </span>
        </div>
      </div>

      <ul className="chaptersList">
        {currentItems.map((chapter) => (
          <Link
            to={`/${manga.name}/${manga.id}/${chapter.name}/${chapter.id}/${chapter.page.last_page_read}`}
            key={chapter.id}>
            <li className={`chapter ${chapter.is_read ? "read" : "unread"}`}>
              <div className="filesInfo">
                <span className="chapterName">{chapter.name}</span>
                <span>
                  Upload: <FaUser />
                </span>
              </div>

              <div className="chapterExtraInfo">
                <span className="createDate">{chapter.created_at}</span>
                <div className="dataInfo">
                  <button
                    onClick={(event) =>
                      markAsRead(event, manga.name, chapter.id)
                    }>
                    {chapter.is_read ? (
                      <IoCheckmarkCircle className="read" aria-label="Lido" />
                    ) : (
                      <IoCheckmarkCircleOutline
                        className="unread"
                        aria-label="Não lido"
                      />
                    )}
                  </button>

                  <button
                    onClick={(event) =>
                      downloadIndividual(event, manga.name, chapter.id)
                    }>
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
                  </button>
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
