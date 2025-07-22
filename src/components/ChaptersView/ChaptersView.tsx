import usePagination from "../../hooks/usePagination";
import useAction from "../../hooks/useAction";
import useDownload from "../../hooks/useDownload";
import { useSerieStore } from "../../store/seriesStore";
import { useState } from "react";
import { Manga } from "electron/types/manga.interfaces";
import useSerie from "../../hooks/useSerie";
import {
  EyeOff,
  Eye,
  ArrowDownToLine,
  ArrowDownFromLine,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import "./ChaptersView.scss";
import {
  LiteratureChapter,
  LiteraturesAttributes,
  LiteratureChapterAttributes,
} from "../../types/series.interfaces";

interface ChaptersViewProps {
  updateSerie: (path: string, newValue: LiteraturesAttributes) => void;
}
type DownloadStatus = "not_downloaded" | "downloading" | "downloaded";

export default function ChaptersView({ updateSerie }: ChaptersViewProps) {
  const rawSerie = useSerieStore((state) => state.serie);
  const serie = rawSerie as Manga;

  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [downloadStatus, setDownloadStatus] = useState<
    Record<number, DownloadStatus>
  >({});

  const [error, setError] = useState<string | null>(null);
  const { openChapter, markAsRead } = useAction(serie!.dataPath);

  const { updateChapter } = useSerie();
  const { downloadIndividual } = useDownload({
    setError,
    setDownloaded,
    setDownloadStatus,
  });
  const { handlePage, pageNumbers, totalPages, currentItems, currentPage } =
    usePagination(serie!.chapters ?? []);

  const markRead = (
    e: React.MouseEvent<HTMLElement>,
    chapter: LiteratureChapter,
    id: number,
    updateChapter: (
      id: number,
      path: string,
      newValue: LiteratureChapterAttributes
    ) => void
  ) => {
    if (chapter.id !== 1) {
      const newValue = serie.chaptersRead + (chapter.isRead ? -1 : 1);
      updateSerie("chaptersRead", newValue);
    }

    markAsRead(e, chapter, id, updateChapter);
  };

  return (
    <section className="Control">
      <h2>Capítulos</h2>

      <ul className="chaptersList">
        {currentItems.map((chapter, index) => (
          <div
            key={chapter.id}
            onClick={(e) => openChapter(e, serie, chapter, downloadIndividual)}
          >
            <li className={`chapter ${chapter.isRead ? "read" : "unread"}`}>
              <span className="chapterName">{chapter.name}</span>

              <div className="actionButtons">
                <button
                  onClick={(e) =>
                    markRead(e, chapter, chapter.id, updateChapter)
                  }
                >
                  {chapter.isRead ? (
                    <Eye size={26} strokeWidth={1} />
                  ) : (
                    <EyeOff size={26} color="#fcf7f8" strokeWidth={1} />
                  )}
                </button>

                <button
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                    downloadIndividual(
                      serie.dataPath,
                      chapter.id,
                      chapter,
                      updateChapter,
                      event
                    )
                  }
                >
                  {downloadStatus[chapter.id] === "downloading" ? (
                    <LoaderCircle
                      size={24}
                      strokeWidth={1}
                      className="animate-spin"
                    />
                  ) : chapter.isDownload ||
                    downloadStatus[chapter.id] === "downloaded" ? (
                    <ArrowDownFromLine size={24} color="#000" strokeWidth={1} />
                  ) : (
                    <ArrowDownToLine
                      size={24}
                      color="#fcf7f8"
                      strokeWidth={1}
                    />
                  )}
                </button>
              </div>
            </li>
          </div>
        ))}
      </ul>
      <section className="ControlBtns" aria-label="Paginação">
        <button
          className="prevBTN"
          onClick={() => handlePage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-disabled={currentPage === 1}
        >
          <ChevronLeft />
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => handlePage(pageNumber)}
            className={pageNumber === currentPage ? "active" : "disable"}
            aria-current={pageNumber === currentPage ? "page" : undefined}
          >
            {pageNumber}
          </button>
        ))}

        <button
          className="nextBTN"
          onClick={() => handlePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-disabled={currentPage === totalPages}
        >
          <ChevronRight />
        </button>
      </section>
    </section>
  );
}
