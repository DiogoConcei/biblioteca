import { useEffect, useState, useMemo } from 'react';

import { useUIStore } from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import { ChapterView } from '../../electron/types/electron-auxiliar.interfaces';

export default function useChapter(serieName: string, chapterId: number) {
  const serie = useSerieStore((state) => state.serie);
  const setError = useUIStore((state) => state.setError);

  const chapter = serie?.chapters?.find((c) => c.id === chapterId);

  const [pages, setPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaType, setMediaType] = useState<'comic' | 'book' | 'pdf'>('comic');
  const [currentPage, setCurrentPage] = useState(0);
  const [originalPath, setOriginalPath] = useState<string | undefined>();
  const [lastCfi, setLastCfi] = useState<string | undefined>();

  useEffect(() => {
    const fetchChapter = async () => {
      setIsLoading(true);
      try {
        const response = await window.electronAPI.chapters.getChapter(serieName, chapterId);
        if (response.success && response.data) {
          const resources = response.data.resources;
          // Se for uma lista de objetos ChapterResource, extraímos apenas os paths (strings)
          const pagesArray = resources.map((res) => 
            typeof res === 'string' ? res : res.path
          );
          
          setPages(pagesArray);
          setMediaType(response.data.type);
          setOriginalPath(response.data.originalPath);
          setLastCfi(chapter?.page?.lastCfi);
        } else {
          setError(response.error || 'Erro desconhecido');
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [serieName, chapterId, setError, chapter?.page?.lastCfi]);

  return useMemo(() => ({
    id: chapter?.id,
    serieName,
    chapterName: chapter?.name,
    name: chapter?.name,
    isDownloaded: chapter?.isDownloaded ?? 'not_downloaded',
    isLoading,
    setIsLoading,
    type: mediaType,
    originalPath,
    lastCfi,
    pages,
    quantityPages: pages.length,
    currentPage,
    setCurrentPage,
  } as ChapterView & { lastCfi?: string }), [
    chapter?.id,
    serieName,
    chapter?.name,
    chapter?.isDownloaded,
    isLoading,
    mediaType,
    originalPath,
    lastCfi,
    pages,
    currentPage,
  ]);
}
