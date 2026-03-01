import { useEffect, useState } from 'react';

import { useUIStore } from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import { ChapterView } from '../../electron/types/electron-auxiliar.interfaces';

export default function useChapter(
  serieName: string,
  chapterId: number,
): ChapterView {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const setError = useUIStore((s) => s.setError);
  const [pages, setPages] = useState<string[]>([]);

  const chapters = useSerieStore((state) => state.chapters);
  const chapter = chapters.find((ch) => ch.id === chapterId) || chapters[0];

  useEffect(() => {
    async function fetchPages() {
      setIsLoading(true);
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
        setCurrentPage(chapter.page.lastPageRead);
      } catch (e) {
        setIsLoading(false);
        setError('Erro ao carregar as páginas do capítulo.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPages();
  }, [serieName, chapterId, chapter.page.lastPageRead, setError]);

  return {
    id: chapter.id,
    serieName: chapter.serieName,
    chapterName: chapter.name,
    isLoading,
    setIsLoading,
    isDownloaded: chapter.isDownloaded,
    pages,
    quantityPages: pages.length,
    currentPage,
    setCurrentPage,
  };
}
