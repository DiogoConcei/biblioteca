import { useState, useEffect, useRef, useCallback } from 'react';
import {
  UseChapterParams,
  useChapterReturn,
} from '../types/customHooks.interfaces';

export default function useChapter({
  serieName,
  chapterId,
  page,
}: UseChapterParams): useChapterReturn {
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const isNextDownloaded = useRef<boolean>(false);
  const isPrevDownloaded = useRef<boolean>(false);

  const fetchChapter = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await window.electronAPI.chapters.getChapter(
        serieName,
        chapterId,
      );
      const data = response.data;

      if (!data || data.length === 0) {
        setPages([]);
        setError('Nenhuma página encontrada');
        return;
      }

      setPages(data);
      setCurrentPage(page);

      const checks: Promise<[boolean, boolean]> = Promise.all([
        await window.electronAPI.download.checkDownload(
          serieName,
          chapterId + 1,
        ),
        chapterId > 1
          ? await window.electronAPI.download.checkDownload(
              serieName,
              chapterId - 1,
            )
          : Promise.resolve(false),
      ]).then(([next, prev]) => [next, prev]);

      const [next, prev] = await checks;
      isNextDownloaded.current = next;
      isPrevDownloaded.current = prev;
    } catch (e) {
      console.error(e);
      setError('Falha em recuperar capítulo. Tente novamente');
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [serieName, chapterId, page]);

  useEffect(() => {
    fetchChapter();
  }, [fetchChapter]);

  const markNextDownloaded = () => {
    isNextDownloaded.current = true;
  };

  const markPrevDownloaded = () => {
    isPrevDownloaded.current = true;
  };

  return {
    serieName,
    chapterId,
    currentPage,
    pages,
    quantityPages: pages.length - 1,
    isLoading: loading,
    error,
    downloaded,
    setDownloaded,
    isNextDownloaded,
    isPrevDownloaded,
    markNextDownloaded,
    markPrevDownloaded,
    setError,
    setCurrentPage,
  };
}
