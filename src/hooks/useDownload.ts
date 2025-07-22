import { useCallback, useRef } from "react";

import {
  LiteratureChapter,
  LiteratureChapterAttributes,
} from "../types/series.interfaces";
import {
  downloadChapter,
  useDownloadParams,
} from "../types/customHooks.interfaces";

export default function useDownload({
  setError,
  setDownloaded,
  setDownloadStatus,
}: useDownloadParams) {
  const isDownloading = useRef(false);

  const downloadInReading = useCallback(
    async ({ serieName, chapterId, alreadyDownloaded }: downloadChapter) => {
      if (alreadyDownloaded.current || isDownloading.current) return;

      isDownloading.current = true;
      try {
        setDownloaded?.(true);
        setDownloadStatus?.((prev) => ({
          ...prev,
          [chapterId]: "downloading",
        }));

        await window.electronAPI.download.readingDownload(serieName, chapterId);

        setDownloadStatus?.((prev) => ({
          ...prev,
          [chapterId]: "downloaded",
        }));
      } catch {
        setError("Falha em baixar o próximo capítulo");

        setDownloadStatus?.((prev) => ({
          ...prev,
          [chapterId]: "not_downloaded",
        }));
      } finally {
        setDownloaded?.(false);
        isDownloading.current = false;
      }
    },
    [setError, setDownloaded, setDownloadStatus]
  );

  const downloadMultipleChapters = useCallback(
    async (dataPath: string, quantity: number) => {
      try {
        const response = await window.electronAPI.download.multipleDownload(
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
    [setError]
  );

  const downloadIndividual = useCallback(
    async (
      dataPath: string,
      id: number,
      chapter: LiteratureChapter,
      updateChapter: (
        index: number,
        path: string,
        newValue: LiteratureChapterAttributes
      ) => void,
      event?: React.MouseEvent<HTMLButtonElement>
    ) => {
      event?.stopPropagation();

      const originalIsDownload = chapter.isDownload;

      if (originalIsDownload) {
        try {
          const success = await window.electronAPI.download.singleRemove(
            dataPath,
            chapter.id
          );

          if (!success) {
            setError("Falha ao deletar capítulo");
            return false;
          }

          updateChapter(id, "isDownload", false);

          setDownloadStatus?.((prev) => ({
            ...prev,
            [chapter.id]: "not_downloaded",
          }));

          return true;
        } catch {
          setError("Erro ao tentar deletar capítulo");
          return false;
        }
      }

      setDownloadStatus?.((prev) => ({
        ...prev,
        [chapter.id]: "downloading",
      }));

      updateChapter(id, "isDownload", true);

      try {
        const response = await window.electronAPI.download.singleDownload(
          dataPath,
          chapter.id
        );

        if (!response) {
          setError("Falha ao baixar capítulo");
          updateChapter(id, "isDownload", false);

          setDownloadStatus?.((prev) => ({
            ...prev,
            [chapter.id]: "not_downloaded",
          }));

          return false;
        }

        setDownloadStatus?.((prev) => ({
          ...prev,
          [chapter.id]: "downloaded",
        }));

        return true;
      } catch {
        setError("Erro ao tentar baixar capítulo");
        updateChapter(id, "isDownload", false);

        setDownloadStatus?.((prev) => ({
          ...prev,
          [chapter.id]: "not_downloaded",
        }));

        return false;
      }
    },
    [setError, setDownloadStatus]
  );

  return { downloadInReading, downloadMultipleChapters, downloadIndividual };
}
