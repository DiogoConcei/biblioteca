import { useEffect, useState } from 'react';

import { useUIStore } from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import { ChapterView } from '../../electron/types/electron-auxiliar.interfaces';
import { MediaContent } from '../../electron/types/media.interfaces';

export default function useChapter(
  serieName: string,
  chapterId: number,
): ChapterView {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const setError = useUIStore((s) => s.setError);
  const [pages, setPages] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'comic' | 'book' | 'pdf'>('comic');
  const [originalPath, setOriginalPath] = useState<string | undefined>();

  const chapters = useSerieStore((state) => state.chapters);
  const chapter = chapters.find((ch) => ch.id === chapterId) || chapters[0];

  useEffect(() => {
    async function fetchPages() {
      if (!chapter) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electronAPI.chapters.getChapter(
          serieName,
          chapterId,
        );

        const content = response.data as MediaContent;

        if (!content) {
          setPages([]);
          setError('Nenhuma página encontrada');
          return;
        }

        setMediaType(content.type);
        setOriginalPath(content.originalPath);

        if (Array.isArray(content.resources)) {
          if (content.resources.length > 0) {
            // Armazena os recursos independentemente de serem strings ou objetos
            // O componente visualizador fará o cast necessário
            setPages(content.resources as string[]);
          } else {
            setPages([]);
          }
        }

        setCurrentPage(chapter.page?.lastPageRead || 0);
      } catch (e) {
        setIsLoading(false);
        setError('Erro ao carregar as páginas do capítulo.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPages();
  }, [serieName, chapterId, chapter?.page?.lastPageRead, setError]);

  return {
    id: chapter?.id || 0,
    serieName: chapter?.serieName || '',
    chapterName: chapter?.name || '',
    isLoading,
    setIsLoading,
    type: mediaType,
    originalPath,
    isDownloaded: chapter?.isDownloaded || 'not_downloaded',
    pages,
    quantityPages: pages.length,
    currentPage,
    setCurrentPage,
  };
}
