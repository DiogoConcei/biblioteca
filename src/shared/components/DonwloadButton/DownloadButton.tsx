import { useState } from 'react';
import { Download } from 'lucide-react';

import useDownload from '@/shared/hooks/useDownload';
import { useUIStore } from '@/shared/store/useUIStore';
import useClickOutside from '@/shared/hooks/useClickOutside';
import useSerieStore from '@/shared/store/useSerieStore';
import styles from './DownloadButton.module.scss';

const BASE_OPTIONS = [1, 5, 10, 20, 25];

export default function DownloadButton() {
  const serie = useSerieStore((state) => state.serie);
  const chapters = useSerieStore((state) => state.chapters);
  const updateChapter = useSerieStore((state) => state.updateChapter);
  const setError = useUIStore((state) => state.setError);
  const { downloadMultipleChapters } = useDownload();

  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const startIndex = serie?.metadata.lastDownload ?? 0;
  const remaining = Math.max(chapters.length - startIndex, 0);
  const options =
    remaining > 0 ? [...BASE_OPTIONS.filter((q) => q < remaining), remaining] : [];

  const setStatus = (list: typeof chapters, status: string) =>
    list.forEach((c) => updateChapter(c.id, 'isDownloaded', status));

  const onSelect = async (quantity: number) => {
    const target = chapters.slice(startIndex, startIndex + quantity);

    setIsOpen(false);
    setIsDownloading(true);
    setStatus(target, 'downloading');

    const response = await downloadMultipleChapters(quantity);

    if (response) {
      setStatus(target, 'downloaded');
    } else {
      setStatus(target, 'not_downloaded');
      setError('Falha ao baixar capítulos');
    }
    setIsDownloading(false);
  };

  const labelFor = (quantity: number) =>
    quantity === remaining && remaining > 1
      ? `Todos (${quantity})`
      : `${quantity} ${quantity === 1 ? 'capítulo' : 'capítulos'}`;

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <button
        type="button"
        className={styles.download}
        onClick={() => setIsOpen((open) => !open)}
        disabled={remaining === 0 || isDownloading}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={remaining === 0 ? 'Tudo já foi baixado' : undefined}
      >
        <Download size={18} />
        {isDownloading ? 'Baixando...' : 'Download'}
      </button>

      {isOpen && (
        <ul className={styles.list} role="menu">
          {options.map((quantity) => (
            <li key={quantity} role="none">
              <button
                type="button"
                className={styles.option}
                role="menuitem"
                onClick={() => onSelect(quantity)}
              >
                {labelFor(quantity)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
