import {
  useChapterReturn,
  useSimpleNavigationReturn,
} from '../types/customHooks.interfaces';
import useDownload from './useDownload';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSerieStore } from '../store/seriesStore';

export default function useNavigation(
  chapter: useChapterReturn,
): useSimpleNavigationReturn {
  const serie = useSerieStore((state) => state.serie);
  const navigate = useNavigate();

  const { downloadInReading } = useDownload({
    setError: chapter.setError,
    setDownloaded: chapter.setDownloaded,
  });

  const nextChapter = useCallback(async () => {
    const nextChapterId = chapter.chapterId + 1;

    if (nextChapterId >= serie?.totalChapters!) return;

    if (!chapter.isNextDownloaded.current) {
      await downloadInReading({
        serieName: chapter.serieName,
        chapterId: chapter.chapterId + 1,
        alreadyDownloaded: chapter.isNextDownloaded,
      });
      chapter.markNextDownloaded();
    }

    if (!chapter.error) {
      try {
        const response = await window.electronAPI.chapters.getNextChapter(
          chapter.serieName,
          chapter.chapterId,
        );

        const nextChapterUrl = response.data;

        console.log(nextChapterUrl);
        await window.electronAPI.chapters.saveLastRead(
          chapter.serieName,
          chapter.chapterId,
          chapter.currentPage,
        );

        if (chapter.isNextDownloaded.current && nextChapterUrl) {
          navigate(nextChapterUrl);
        }
      } catch {
        chapter.setError('Falha em exibir o proximo capitulo');
      }
    }
  }, [
    chapter.chapterId,
    chapter.currentPage,
    chapter.isNextDownloaded,
    chapter.isPrevDownloaded,
  ]);

  const prevChapter = useCallback(async () => {
    if (chapter.chapterId <= 1) return;

    if (!chapter.isNextDownloaded.current) {
      await downloadInReading({
        serieName: chapter.serieName,
        chapterId: chapter.chapterId - 1,
        alreadyDownloaded: chapter.isPrevDownloaded,
      });
      chapter.markPrevDownloaded();
    }

    if (!chapter.error) {
      try {
        const response = await window.electronAPI.chapters.getPrevChapter(
          chapter.serieName,
          Number(chapter.chapterId),
        );
        const prevChapterUrl = response.data;

        await window.electronAPI.chapters.saveLastRead(
          chapter.serieName,
          chapter.chapterId,
          chapter.currentPage,
        );

        if (chapter.isPrevDownloaded && prevChapterUrl) {
          navigate(prevChapterUrl);
        }
      } catch {
        chapter.setError('Falha em exibir o capitulo anterior');
      }
    }
  }, [
    chapter.chapterId,
    chapter.currentPage,
    chapter.isNextDownloaded,
    chapter.isPrevDownloaded,
  ]);

  const nextPage = useCallback(async () => {
    try {
      if (chapter.currentPage < chapter.quantityPages) {
        chapter.setCurrentPage((prev) => prev + 1);
      } else {
        await nextChapter();
      }
    } catch (error) {
      chapter.setError('falha em localizar próxima a página');
    }
  }, [
    chapter.currentPage,
    chapter.pages,
    chapter.isNextDownloaded,
    chapter.isPrevDownloaded,
    ,
    nextChapter,
  ]);

  const prevPage = useCallback(async () => {
    try {
      if (chapter.currentPage > 0) {
        chapter.setCurrentPage(chapter.currentPage - 1);
      } else {
        await prevChapter();
      }
    } catch {
      chapter.setError('Falha ao retroceder páginas');
    }
  }, [chapter.currentPage, chapter.pages]);

  return { nextChapter, nextPage, prevChapter, prevPage };
}
