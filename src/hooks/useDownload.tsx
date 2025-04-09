import { useCallback, useRef, useState } from "react";
import { LiteratureChapter } from "../types/series.interfaces";
import {
  downloadChapter,
  useDownloadParams,
} from "../types/customHooks.interfaces";

export default function useDownload({
  setError,
  setDownloaded,
}: useDownloadParams) {
  const isDownloading = useRef(false);

  const downloadInReading = useCallback(
    async ({ serieName, chapterId, alreadyDownloaded }: downloadChapter) => {
      if (alreadyDownloaded.current || isDownloading.current) return;

      isDownloading.current = true;
      try {
        setDownloaded(true);
        await window.electron.download.readingDownload(serieName, chapterId);
        alreadyDownloaded.current = true;
      } catch {
        setError("Falha em baixar o próximo capítulo");
      } finally {
        setDownloaded(false);
        isDownloading.current = false;
      }
    },
    [setError, setDownloaded]
  );

  const downloadMultipleChapters = useCallback(
    async (dataPath: string, quantity: number) => {
      try {
        const response = await window.electron.download.multipleDownload(
          dataPath,
          quantity
        );

        if (!response) {
          setError("Falha ao baixar capítulos");
          return response;
        }

        return response;
      } catch {
        setError("Falha ao executar download");
        return false;
      }
    },
    [setError, setDownloaded]
  );

  const downloadIndividual = useCallback(
    async (
      event: React.MouseEvent<HTMLButtonElement>,
      dataPath: string,
      chapter_id: number,
      chapter: LiteratureChapter,
      updateChapter: (path: string, newValue: any) => Promise<void>
    ) => {
      event.stopPropagation();
      const originalIsDownload = chapter.isDownload;
      const path = `chapters.${chapter_id}.isDownload`;

      console.log(`path: ${path}`);

      updateChapter(path, !originalIsDownload);

      try {
        const response = await window.electron.download.singleDownload(
          dataPath,
          chapter_id
        );

        if (!response) {
          setError("Falha ao baixar capítulo");
          updateChapter(path, originalIsDownload);
          return response;
        }

        return response;
      } catch {
        setError("Falha ao executar download");
        updateChapter(path, !originalIsDownload);
        return false;
      }
    },
    [setError, setDownloaded]
  );

  return { downloadInReading, downloadMultipleChapters, downloadIndividual };
}
