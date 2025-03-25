import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChaptersInfoProp } from "../../types/components.interfaces";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoCheckmarkCircle } from "react-icons/io5";
import { MdOutlineDownload, MdFileDownload, MdUpload } from "react-icons/md";
import { PiSortDescendingThin, PiSortAscendingThin } from "react-icons/pi";
import { FaUser } from "react-icons/fa";
import { Manga, MangaChapter } from "../../types/manga.interfaces";
import Pagination from "../Pagination/Pagination";
import "./ChaptersInfo.css";

export default function ChaptersInfo({ manga, setManga }: ChaptersInfoProp) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isAscendig, setAscending] = useState<boolean>(false);
  const [chapters, setChapters] = useState<MangaChapter[]>(manga.chapters);
  const itemsPerPage = 11;
  const totalPages = Math.ceil(manga.chapters.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = chapters.slice(startIndex, endIndex);

  const navigate = useNavigate();

  useEffect(() => {
    setChapters(manga.chapters);
  }, [manga.chapters]);

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
    dataPath: string,
    chapter: MangaChapter,
    chapter_id: number
  ) => {
    event.stopPropagation();

    const originalIsRead = chapter.isRead;

    setManga((prevManga) => {
      const updatedChapters = prevManga.chapters.map((chap) =>
        chap.id === chapter_id ? { ...chap, isRead: !chap.isRead } : chap
      );

      const chaptersRead = !originalIsRead
        ? prevManga.chaptersRead + 1
        : prevManga.chaptersRead - 1;

      return {
        ...prevManga,
        chapters: updatedChapters,
        chaptersRead: Math.max(0, chaptersRead),
        readingData: {
          ...prevManga.readingData,
          lastChapterId: chapter_id,
        },
      };
    });

    try {
      const response = await window.electron.userAction.markRead(
        dataPath,
        chapter_id,
        !originalIsRead
      );

      if (!response.success) {
        throw new Error("Falha na operação");
      }
    } catch (e) {
      setManga((prevManga) => {
        const revertedChapters = prevManga.chapters.map((chap) =>
          chap.id === chapter_id ? { ...chap, isRead: originalIsRead } : chap
        );

        return {
          ...prevManga,
          chapters: revertedChapters,
          chaptersRead: originalIsRead
            ? prevManga.chaptersRead + 1
            : prevManga.chaptersRead - 1,
          readingData: {
            ...prevManga.readingData,
            lastChapterId: chapter_id,
          },
        };
      });
    }
  };

  const downloadIndividual = async (
    event: React.MouseEvent<HTMLButtonElement>,
    dataPath: string,
    chapter_id: number,
    chapter: MangaChapter
  ) => {
    event.stopPropagation();

    const isDownload = chapter.isDownload;

    setChapters((prevChapters) =>
      prevChapters.map((chap) =>
        chap.id === chapter_id
          ? { ...chap, isDownload: !chap.isDownload }
          : chap
      )
    );

    try {
      const response = await window.electron.download.singleDownload(
        dataPath,
        chapter_id
      );

      if (!response) {
        throw new Error("Falha no download");
      }
    } catch (e) {
      setChapters((prevChapters) =>
        prevChapters.map((chap) =>
          chap.id === chapter_id ? { ...chap, isDownload: isDownload } : chap
        )
      );
    }
  };

  const openChapter = async (
    e: React.MouseEvent<HTMLDivElement>,
    manga: Manga,
    chapter: MangaChapter
  ) => {
    e.stopPropagation();

    const { name: serieName, id: serieId } = manga;
    const { name: chapterName, id: chapterId, page, isRead } = chapter;

    const safeOpen = await window.electron.download.checkDownload(
      serieName,
      chapterId
    );

    if (safeOpen) {
      navigate(
        `/${serieName}/${serieId}/${chapterName}/${chapterId}/${page.lastPageRead}/${isRead}`
      );
    }
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
                    onClick={(event) =>
                      markAsRead(event, manga.dataPath, chapter, chapter.id)
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
                    onClick={(event) =>
                      downloadIndividual(
                        event,
                        manga.dataPath,
                        chapter.id,
                        chapter
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
      />
    </section>
  );
}
