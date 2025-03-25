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
  const downloadingNext = useRef(true);

  useEffect(() => {
    async function getChapter() {
      setLoading(true);
      setError(null);

      try {
        const data = await window.electron.chapters.getChapter(
          serieName,
          Number(chapterId)
        );

        if (data) {
          setPages(data);
          setCurrentPage(Number(page));
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
        setTimeout(() => setLoading(false), 10);
      }
    }

    getChapter();
  }, [serieName, chapterId]);

  const triggerDownload = async () => {
    if (downloadingNext.current) {
      downloadingNext.current = false;
      try {
        await window.electron.download.readingDownload(
          serieName,
          Number(chapterId)
        );
      } catch {
        setError("Falha ao baixar capitulo");
      }
    }
  };

  const chapterInfo: useChapterReturn = {
    serieName: serieName,
    chapterId: Number(chapterId),
    currentPage: currentPage,
    pages: pages,
    quantityPages: pages.length - 1,
    isLoading: loading,
    downloadingNext: downloadingNext,
    error: error,
    setError: setError,
    setCurrentPage: setCurrentPage,
    triggerDownload,
  };

  return chapterInfo;
}
