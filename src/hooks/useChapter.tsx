import { useState, useEffect, useRef } from "react";
import {
  UseChapterParams,
  useChapterReturn,
} from "../types/customHooks.interfaces";

export default function useChapter({
  serieName,
  chapterId,
  page,
}: UseChapterParams): useChapterReturn {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pages, setPages] = useState<string[] | null>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const isNextDownloaded = useRef<boolean>(false);
  const isPrevDownloaded = useRef<boolean>(false);

  useEffect(() => {
    async function getChapter() {
      setLoading(true);
      setError(null);

      try {
        const chapter_id = Number(chapterId);

        const data = await window.electron.chapters.getChapter(
          serieName,
          chapter_id
        );

        if (data) {
          setPages(data);
          setCurrentPage(Number(page));

          isNextDownloaded.current =
            await window.electron.download.checkDownload(
              serieName,
              chapter_id + 1
            );

          if (chapter_id > 1) {
            isPrevDownloaded.current =
              await window.electron.download.checkDownload(
                serieName,
                chapter_id - 1
              );
          }
        } else if (pages.length === 0) {
          setError("Nenhuma página encontrada");
        } else {
          setError("Nenhum dado foi encontrado para o capítulo.");
          setPages([]);
        }
      } catch (e) {
        setError("Falha em recuperar capítulo. Tente novamente");
        setPages([]);
      } finally {
        setTimeout(() => setLoading(false), 0);
      }
    }

    getChapter();
  }, [serieName, chapterId]);

  const chapterInfo: useChapterReturn = {
    serieName: serieName,
    chapterId: Number(chapterId),
    currentPage: currentPage,
    pages: pages,
    quantityPages: pages.length - 1,
    isLoading: loading,
    error: error,
    downloaded: downloaded,
    setDownloaded: setDownloaded,
    isNextDownloaded: isNextDownloaded,
    isPrevDownloaded: isPrevDownloaded,
    setError: setError,
    setCurrentPage: setCurrentPage,
  };

  return chapterInfo;
}
