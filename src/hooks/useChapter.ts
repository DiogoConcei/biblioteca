import useUIStore from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import { useEffect, useState } from 'react';
import { ChapterView } from '../../electron/types/electron-auxiliar.interfaces';
import useSerie from '../hooks/useSerie';
import { useParams } from 'react-router-dom';

export default function useChapter(
  serieName: string,
  chapterId: number,
): ChapterView {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const setError = useUIStore((state) => state.setError);
  const [pages, setPages] = useState<string[]>([]);

  const chapters = useSerieStore((state) => state.chapters);
  const chapter = chapters.find((ch) => ch.id === chapterId) || chapters[0];

  const fetchPages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Nome da série: ${serieName}, id do capítulo ${chapterId}`);

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
  };

  useEffect(() => {
    fetchPages();
  }, [serieName, chapterId]);

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
