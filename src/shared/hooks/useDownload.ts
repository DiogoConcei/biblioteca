import { LiteratureChapter } from '../../../electron/types/electron-auxiliar.interfaces';
import useSerieStore from '../store/useSerieStore';
import { useUIStore } from '../store/useUIStore';

export default function useDownload() {
  const updateChapter = useSerieStore((state) => state.updateChapter);
  const setError = useUIStore((state) => state.setError);

  const downloadInReading = async (
    readingChapter: LiteratureChapter,
  ): Promise<boolean> => {
    if (
      readingChapter.isDownloaded === 'downloaded' ||
      readingChapter.isDownloaded === 'downloading'
    )
      return true;

    updateChapter(readingChapter.id, 'isDownloaded', 'downloading');

    try {
      const response = await window.electronAPI.download.readingDownload(
        readingChapter.serieName,
        readingChapter.id,
      );

      if (!response) {
        setError('Falha ao baixar capítulo');
        updateChapter(readingChapter.id, 'isDownloaded', 'not_downloaded');
        return false;
      }

      updateChapter(readingChapter.id, 'isDownloaded', 'downloaded');
      return true;
    } catch {
      setError('Falha ao baixar o capítulo');
      updateChapter(readingChapter.id, 'isDownloaded', 'not_downloaded');
      return false;
    }
  };

  const downloadIndividual = async (
    e: React.MouseEvent,
    selectedChapter: LiteratureChapter,
  ) => {
    e.stopPropagation();
    const { serie, chapters } = useSerieStore.getState();
    const dataPath = serie?.dataPath;

    // Busca o capítulo mais atualizado para evitar stale closures
    const freshChapter =
      chapters.find((ch) => ch.id === selectedChapter.id) || selectedChapter;

    if (freshChapter.isDownloaded === 'downloaded') {
      updateChapter(freshChapter.id, 'isDownloaded', 'downloading');

      const success = await window.electronAPI.download.singleRemove(
        dataPath!,
        freshChapter.id,
      );

      if (!success) {
        setError('Falha ao remover o capítulo');
        updateChapter(freshChapter.id, 'isDownloaded', 'downloaded');
        return;
      }

      updateChapter(freshChapter.id, 'isDownloaded', 'not_downloaded');
    } else {
      updateChapter(freshChapter.id, 'isDownloaded', 'downloading');

      const success = await window.electronAPI.download.singleDownload(
        dataPath!,
        freshChapter.id,
      );

      if (!success) {
        setError('Falha ao baixar capítulo');
        updateChapter(freshChapter.id, 'isDownloaded', 'not_downloaded');
        return;
      }

      updateChapter(freshChapter.id, 'isDownloaded', 'downloaded');
    }
  };

  const downloadMultipleChapters = async (quantity: number) => {
    const { serie } = useSerieStore.getState();
    const dataPath = serie?.dataPath;

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
