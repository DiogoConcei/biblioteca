import { LiteratureChapter } from '../../electron/types/electron-auxiliar.interfaces';
import useSerieStore from '../store/useSerieStore';
import useUIStore from '../store/useUIStore';

export default function useDownload() {
  const dataPath = useSerieStore((state) => state.serie?.dataPath);
  const updateChapter = useSerieStore((state) => state.updateChapter);
  const setError = useUIStore((state) => state.setError);

  const downloadInReading = async (readingChapter: LiteratureChapter) => {
    if (
      readingChapter.isDownloaded === 'downloaded' ||
      readingChapter.isDownloaded === 'downloading'
    )
      return;

    updateChapter(readingChapter.id, 'isDownloaded', 'downloading');

    try {
      await window.electronAPI.download.readingDownload(
        readingChapter.serieName,
        readingChapter.id,
      );

      updateChapter(readingChapter.id, 'isDownloaded', 'downloaded');
    } catch {
      setError('Falha ao baixar o capítulo');

      updateChapter(readingChapter.id, 'isDownloaded', 'not_downloaded');
    }
  };

  const downloadIndividual = async (
    e: React.MouseEvent,
    selectedChapter: LiteratureChapter,
  ) => {
    e.stopPropagation();
    if (selectedChapter.isDownloaded === 'downloaded') {
      updateChapter(selectedChapter.id, 'isDownloaded', 'downloading');

      const success = await window.electronAPI.download.singleRemove(
        dataPath!,
        selectedChapter.id,
      );

      if (!success) {
        setError('Falha ao remover o capítulo');
        updateChapter(selectedChapter.id, 'isDownloaded', 'downloaded');
        return;
      }

      updateChapter(selectedChapter.id, 'isDownloaded', 'not_downloaded');
    } else {
      updateChapter(selectedChapter.id, 'isDownloaded', 'downloading');

      const success = await window.electronAPI.download.singleDownload(
        dataPath!,
        selectedChapter.id,
      );

      if (!success) {
        setError('Falha ao baixar capítulo');
        updateChapter(selectedChapter.id, 'isDownloaded', 'not_downloaded');
        return;
      }

      updateChapter(selectedChapter.id, 'isDownloaded', 'downloaded');
    }
  };

  const downloadMultipleChapters = async (quantity: number) => {
    try {
      const response = await window.electronAPI.download.multipleDownload(
        dataPath!,
        quantity,
      );

      if (!response) {
        setError('Falha ao baixar capítulos');
      }

      return response;
    } catch {
      setError('Falha ao baixar multiplos capítulos');
      return false;
    }
  };

  return { downloadInReading, downloadIndividual, downloadMultipleChapters };
}
