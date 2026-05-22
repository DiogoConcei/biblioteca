import { useEffect, useState, useMemo } from 'react';

import { useUIStore } from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import { ChapterView } from '../../electron/types/electron-auxiliar.interfaces';

export default function useChapter(serieName: string, chapterId: number) {
  const setError = useUIStore((state) => state.setError);

  const chapters = useSerieStore((state) => state.chapters);
  const chapter = chapters.find((c) => c.id === chapterId);

  const [pages, setPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaType, setMediaType] = useState<'comic' | 'book' | 'pdf'>('comic');
  const [currentPage, setCurrentPage] = useState(0);
  const [originalPath, setOriginalPath] = useState<string | undefined>();
  const [lastCfi, setLastCfi] = useState<string | undefined>();
  const [lastPageRead, setLastPageRead] = useState<number | undefined>();

  useEffect(() => {
    const fetchChapter = async () => {
      setIsLoading(true);
      try {
        const response = await window.electronAPI.chapters.getChapter(
          serieName,
          chapterId,
        );

        if (response.success && response.data) {
          const resources = response.data.resources;

          const pagesArray = resources.map((res) =>
            typeof res === 'string' ? res : res.path,
          );

          setPages(pagesArray);
          setMediaType(response.data.type);
          setOriginalPath(response.data.originalPath);
          setLastCfi(response.lastCfi || chapter?.page?.lastCfi);
          setLastPageRead(
            response.lastPageRead !== undefined
              ? response.lastPageRead
              : chapter?.page?.lastPageRead,
          );
        } else {
          setError(
            'Infelizmente não conseguimos encontrar o seu capítulo. Tente baixar novamente ou verifique a página de configurações para mais detalhes.',
          );
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [
    serieName,
    chapterId,
    setError,
    chapter?.page?.lastCfi,
    chapter?.page?.lastPageRead,
  ]);

  return useMemo(
    () =>
      ({
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
        lastPageRead,
        pages,
        quantityPages: pages.length,
        currentPage,
        setCurrentPage,
      }) as ChapterView & { lastCfi?: string },
    [
      chapter?.id,
      serieName,
      chapter?.name,
      chapter?.isDownloaded,
      isLoading,
      mediaType,
      originalPath,
      lastCfi,
      lastPageRead,
      pages,
      currentPage,
    ],
  );
}
