import { useCallback, useRef } from "react";
import {
  downloadChapter,
  useDownloadParams,
} from "../types/customHooks.interfaces";

export default function useDownload({
  setError,
  setDownloaded,
}: useDownloadParams) {
  const downloadNextChapter = useCallback(
    async ({ serieName, chapterId, alreadyDownloaded }: downloadChapter) => {
      if (alreadyDownloaded.current) return;

      try {
        if (!alreadyDownloaded.current) {
          setDownloaded(true);
          await window.electron.download.readingDownload(serieName, chapterId);
          alreadyDownloaded.current = true;
        }
      } catch {
        setError("Falha em baixar o próximo capítulo");
      } finally {
        setDownloaded(false);
      }
    },
    [setError]
  );

  return downloadNextChapter;
}
