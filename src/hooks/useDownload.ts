import { useCallback, useRef } from 'react';

import { LiteratureChapter, LiteratureChapterAttributes } from '../types/series.interfaces';
import { downloadChapter, useDownloadParams } from '../types/customHooks.interfaces';

export default function useDownload({ setError, setDownloaded }: useDownloadParams) {
  const isDownloading = useRef(false);

  const downloadInReading = useCallback(
    async ({ serieName, chapterId, alreadyDownloaded }: downloadChapter) => {
      if (alreadyDownloaded.current || isDownloading.current) return;

      isDownloading.current = true;
      try {
        if (setDownloaded) setDownloaded(true);
        await window.electronAPI.download.readingDownload(serieName, chapterId);
      } catch {
        setError('Falha em baixar o próximo capítulo');
      } finally {
        if (setDownloaded) setDownloaded(false);
        isDownloading.current = false;
      }
    },
    [setError, setDownloaded],
  );

  const downloadMultipleChapters = useCallback(
    async (dataPath: string, quantity: number) => {
      try {
        const response = await window.electronAPI.download.multipleDownload(dataPath, quantity);

        if (!response) {
          setError('Falha ao baixar capítulos');
          return response;
        }

        return response;
      } catch {
        setError('Falha ao executar download');
        return false;
      }
    },
    [setError],
  );

  const downloadIndividual = useCallback(
    async (
      event: React.MouseEvent<HTMLButtonElement>,
      dataPath: string,
      chapter_id: number,
      chapter: LiteratureChapter,
      updateChapter: (index: number, path: string, newValue: LiteratureChapterAttributes) => void,
    ) => {
      event.stopPropagation();
      const originalIsDownload = chapter.isDownload;
      const path = `chapters.${chapter_id}.isDownload`;

      updateChapter(chapter_id, path, !originalIsDownload);

      try {
        const response = await window.electronAPI.download.singleDownload(dataPath, chapter_id);

        if (!response) {
          setError('Falha ao baixar capítulo');
          updateChapter(chapter_id, path, originalIsDownload);
          return response;
        }

        return response;
      } catch {
        setError('Falha ao executar download');
        updateChapter(chapter_id, path, !originalIsDownload);
        return false;
      }
    },
    [setError],
  );

  return { downloadInReading, downloadMultipleChapters, downloadIndividual };
}
