import { useMemo } from 'react';
import { Download } from 'lucide-react';

import useDownload from '../../hooks/useDownload';
import ErrorScreen from '../ErrorScreen/ErrorScreen';
import { downloadButtonProps } from '../../types/components.interfaces';

import CustomSelect from '../CustomSelect/CustomSelect';
import useSerieStore from '../../store/useSerieStore';
import useUIStore from '../../store/useUIStore';
import styles from './DownloadButton.module.scss';

export default function DownloadButton({ serie }: downloadButtonProps) {
  const chapters = useSerieStore((state) => state.chapters);
  const error = useUIStore((state) => state.error);
  const setError = useUIStore((state) => state.setError);
  const updateChapter = useSerieStore((state) => state.updateChapter);
  const { downloadMultipleChapters } = useDownload();

  const options = useMemo(
    () => [1, 5, 10, 20, 25].map((value) => ({ value, label: `${value}` })),
    [],
  );

  const onSelect = async (quantityValue: string | number) => {
    const quantity = Number(quantityValue);

    if (quantity <= 0) return;

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
      return;
    }

    for (let i = 0; i < downloadingChapters.length; i++) {
      updateChapter(downloadingChapters[i].id, 'isDownloaded', 'downloaded');
    }
  };

  if (error) {
    return <ErrorScreen error={error} serieName="" />;
  }

  return (
    <div className={styles.downloadWrapper}>
      <div className={styles.downloadTitle}>
        <Download />
        <span>Download</span>
      </div>

      <CustomSelect
        options={options}
        placeholder="Qtd. capítulos"
        onChange={(value) => void onSelect(value)}
        className={styles.downloadSelect}
      />
    </div>
  );
}
