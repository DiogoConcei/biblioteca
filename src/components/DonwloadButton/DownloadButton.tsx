import { useState } from 'react';
import { Download } from 'lucide-react';

import useDownload from '../../hooks/useDownload';
import useSerie from '../../hooks/useSerie';
import ErrorScreen from '../ErrorScreen/ErrorScreen';
import { downloadButtonProps } from '../../types/components.interfaces';

import styles from './DownloadButton.module.scss';
import { useSerieStore } from '../../store/seriesStore';

export default function DownloadButton({ serie }: downloadButtonProps) {
  const error = useSerieStore((state) => state.error);
  const setError = useSerieStore((state) => state.setError);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { updateChapter } = useSerie(serie.name);
  const { downloadMultipleChapters: downloadChapters } = useDownload({
    setError,
  });

  const options = [1, 5, 10, 20, 25];

  const onToggle = () => {
    setIsOpen((prevState) => !prevState);
  };

  const onSelect = async (quantity: number) => {
    setSelectedQuantity(quantity);

    if (quantity > 0) {
      const startIndex = serie.metadata.lastDownload;
      const endIndex = startIndex + quantity;
      const chapters: string[] = [];

      for (let i = startIndex; i < endIndex; i++) {
        const path = `chapters.${i}.isDownload`;
        updateChapter(i, path, true);
        chapters.push(path);
      }

      const response = await downloadChapters(serie.dataPath, quantity);

      if (!response) {
        for (let i = startIndex; i < endIndex; i++) {
          const path = `chapters.${i}.isDownload`;
          updateChapter(i, path, false);
          chapters.push(path);
        }

        setError('Falha ao baixar capítulos');
      }

      setIsOpen(false);
    }
  };

  if (error) {
    return <ErrorScreen error={error} serieName="" />;
  }

  return (
    <div>
      <button
        className={`${styles.download} ${isOpen ? styles.open : ''}`}
        onClick={onToggle}
      >
        <Download />
        Download
      </button>

      {isOpen && (
        <ul className={styles['dropdown-list']}>
          {options.map((quantity) => (
            <li key={quantity} className={styles['dropdown-item']}>
              <button
                className={styles['dropdown-option']}
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
