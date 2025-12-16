import useDownload from '../../hooks/useDownload';
import useAction from '../../hooks/useAction';
import usePagination from '../../hooks/usePagination';
import {
  EyeOff,
  Eye,
  ArrowDownToLine,
  ArrowDownFromLine,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react';
import styles from './ListView.module.scss';

export default function ListView() {
  const { downloadIndividual } = useDownload();
  const { openChapter, markAsRead } = useAction();

  const { handlePage, pageNumbers, totalPages, currentItems, currentPage } =
    usePagination();

  return (
    <section className={styles.Control}>
      <h2>Capítulos</h2>

      <ul className={styles.chaptersList}>
        {currentItems.map((chapter, idx) => (
          <div key={chapter.id} onClick={(e) => openChapter(e, chapter)}>
            <li
              className={`${styles.chapter} ${
                chapter.isRead ? styles.read : styles.unread
              }`}
            >
              <span className={styles.chapterName}>{chapter.name}</span>

              <div className={styles.actionButtons}>
                <button onClick={(e) => markAsRead(e, chapter)}>
                  {chapter.isRead ? (
                    <Eye size={26} strokeWidth={1} />
                  ) : (
                    <EyeOff size={26} strokeWidth={1} />
                  )}
                </button>

                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                    downloadIndividual(e, chapter)
                  }
                >
                  {chapter.isDownloaded === 'downloading' ? (
                    <LoaderCircle
                      size={24}
                      strokeWidth={1}
                      className={styles.animateSpin}
                    />
                  ) : chapter.isDownloaded === 'downloaded' ? (
                    <ArrowDownFromLine className={styles.iconDownloaded} />
                  ) : (
                    <ArrowDownToLine className={styles.iconNotDownloaded} />
                  )}
                </button>
              </div>
            </li>
          </div>
        ))}
      </ul>

      <section className={styles.ControlBtns} aria-label="Paginação">
        <button
          className={styles.prevBTN}
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
            className={
              pageNumber === currentPage ? styles.active : styles.disable
            }
            aria-current={pageNumber === currentPage ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        ))}

        <button
          className={styles.nextBTN}
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
