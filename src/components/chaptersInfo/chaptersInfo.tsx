import { PiSortDescendingThin, PiSortAscendingThin } from "react-icons/pi";
import { MdOutlineDownload, MdFileDownload, MdUpload } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoCheckmarkCircle } from "react-icons/io5";

import Pagination from "../Pagination/Pagination";
import { ChaptersInfoProp } from "../../types/components.interfaces";
import { MangaChapter } from "../../types/manga.interfaces";

import usePagination from "../../hooks/usePagination";
import useAction from "../../hooks/useAction";
import useDownload from "../../hooks/useDownload";

import { useState } from "react";
import "./ChaptersInfo.css";

export default function ChaptersInfo({
  manga,
  updateSerie,
  updateChapters,
}: ChaptersInfoProp) {
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  const chapters = manga.chapters as MangaChapter[];

  const {
    currentPage,
    totalPages,
    currentItems,
    handlePageChange,
    isAscending,
    toggleOrder,
    paginationNumbers,
  } = usePagination({ chapters });

  const { openChapter, markAsRead } = useAction({ dataPath: manga.dataPath });

  const { downloadIndividual } = useDownload({ setError, setDownloaded });

  return (
    <section className="Control">
      <div className="chaptersTitle">
        <h2>Capítulos</h2>

        <div>
          <span className="orderChapters" onClick={(e) => toggleOrder()}>
            {isAscending ? (
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
          <div key={chapter.id} onClick={(e) => openChapter(e, manga, chapter)}>
            <li className={`chapter ${chapter.isRead ? "read" : "unread"}`}>
              <div className="filesInfo">
                <span className="chapterName">{chapter.name}</span>
                <span>
                  Upload: <FaUser />
                </span>
              </div>

              <div className="chapterExtraInfo">
                <span className="createDate">{chapter.createdAt}</span>
                <div className="dataInfo">
                  <button
                    onClick={(e) =>
                      markAsRead(e, chapter, chapter.id, updateChapters)
                    }
                  >
                    {chapter.isRead ? (
                      <IoCheckmarkCircle className="read" aria-label="Lido" />
                    ) : (
                      <IoCheckmarkCircleOutline
                        className="unread"
                        aria-label="Não lido"
                      />
                    )}
                  </button>

                  <button
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                      downloadIndividual(
                        event,
                        manga.dataPath,
                        chapter.id,
                        chapter,
                        updateChapters
                      )
                    }
                  >
                    {chapter.isDownload ? (
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
          </div>
        ))}
      </ul>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        paginationNumbers={paginationNumbers}
      />
    </section>
  );
}
