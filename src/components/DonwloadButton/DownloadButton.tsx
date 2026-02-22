import { useState } from 'react';
import { Download } from 'lucide-react';

import useDownload from '../../hooks/useDownload';
import ErrorScreen from '../ErrorScreen/ErrorScreen';
import { downloadButtonProps } from '../../types/components.interfaces';

import useSerieStore from '../../store/useSerieStore';
import useUIStore from '../../store/useUIStore';
import useClickOutside from '../../hooks/useClickOutside';
import styles from './DownloadButton.module.scss';

export default function DownloadButton({ serie }: downloadButtonProps) {
  const chapters = useSerieStore((state) => state.chapters);
  const error = useUIStore((state) => state.error);
  const setError = useUIStore((state) => state.setError);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const updateChapter = useSerieStore((state) => state.updateChapter);
  const containerRef = useClickOutside<HTMLDivElement>(
    () => setIsOpen(false),
    isOpen,
  );

  const { downloadMultipleChapters } = useDownload();

  const options = [1, 5, 10, 20, 25];

  const onToggle = () => {
    setIsOpen((prevState) => !prevState);
  };

  const onSelect = async (quantity: number) => {
    if (quantity > 0) {
      const startIndex = serie.metadata.lastDownload;
      const endIndex = startIndex + quantity;
      const downloadingChapters = chapters.slice(startIndex, endIndex);

      for (let i = 0; i < downloadingChapters.length; i++) {
        updateChapter(downloadingChapters[i].id, 'isDownloaded', 'downloading');
      }

      const response = await downloadMultipleChapters(quantity);

      if (!response) {
        for (let i = 0; i < downloadingChapters.length; i++) {
          updateChapter(
            downloadingChapters[i].id,
            'isDownloaded',
            'not_downloaded',
          );
        }

        setError('Falha ao baixar capítulos');
      } else {
        for (let i = 0; i < downloadingChapters.length; i++) {
          updateChapter(
            downloadingChapters[i].id,
            'isDownloaded',
            'downloaded',
          );
        }
      }

      setIsOpen(false);
    }
  };

  if (error) {
    return <ErrorScreen error={error} serieName="" />;
  }

  return (
    <div ref={containerRef}>
      <button
        className={`${styles.download} ${isOpen ? styles.open : ''}`}
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Download />
        Download
      </button>

      {isOpen && (
        <ul className={styles['dropdown-list']} role="menu">
          {options.map((quantity) => (
            <li key={quantity} className={styles['dropdown-item']} role="none">
              <button
                className={styles['dropdown-option']}
                role="menuitem"
                onClick={() => onSelect(quantity)}
              >
                {quantity}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
