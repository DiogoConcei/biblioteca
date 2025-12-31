import useDownload from '../../hooks/useDownload';
import useAction from '../../hooks/useAction';
import useSerieStore from '../../store/useSerieStore';
import usePagination from '../../hooks/usePagination';
import {
  ArrowDownUp,
  Upload,
  EyeOff,
  Eye,
  ArrowDownToLine,
  ArrowDownFromLine,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react';
import { useState } from 'react';

import UploadPopUp from '../UploadPopUp/UploadPopUp';
import styles from './ListView.module.scss';

export default function ListView() {
  const { downloadIndividual } = useDownload();
  const { openChapter, markAsRead } = useAction();
  const [isOrder, setIsOrder] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const setChapters = useSerieStore((s) => s.setChapters);

  const chapters = useSerieStore((s) => s.chapters);

  const { handlePage, pageNumbers, totalPages, currentItems, currentPage } =
    usePagination();

  const orderList = () => {
    if (isOrder) {
      setChapters(chapters.sort((a, b) => a.id - b.id));
    } else {
      setChapters(chapters.sort((a, b) => b.id - a.id));
    }

    setIsOrder((prev) => !prev);
  };

  return (
    <section className={styles.control}>
      <div className={styles['list-header']}>
        <h2>Capítulos</h2>
        <div>
          <button className={styles.sortButton} onClick={orderList}>
            <ArrowDownUp size={26} strokeWidth={1} />
          </button>
          <button
            className={styles.uploadButton}
            onClick={() => setIsOpen(true)}
          >
            <Upload size={26} strokeWidth={1} />
          </button>
        </div>
      </div>

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
                      className={styles['animate-spin']}
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
          type="button"
          className={styles.prevBTN}
          onClick={() => handlePage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-disabled={currentPage === 1}
        >
          <ChevronLeft />
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            type="button"
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
          type="button"
          className={styles.nextBTN}
          onClick={() => handlePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-disabled={currentPage === totalPages}
        >
          <ChevronRight />
        </button>
      </section>

      {isOpen && (
        <UploadPopUp
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          literatureForm="Manga"
        />
      )}
    </section>
  );
}
