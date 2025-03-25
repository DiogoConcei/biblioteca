import {
  useChapterReturn,
  useSimpleNavigationReturn,
} from "../types/customHooks.interfaces";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function useSimpleNavigation(
  chapter: useChapterReturn
): useSimpleNavigationReturn {
  const navigate = useNavigate();

  const nextChapter = useCallback(async () => {
    try {
      const nextChapterUrl = await window.electron.chapters.getNextChapter(
        chapter.serieName,
        chapter.chapterId
      );
      await window.electron.chapters.saveLastRead(
        chapter.serieName,
        chapter.chapterId,
        chapter.currentPage
      );

      chapter.downloadingNext.current = false;
      if (chapter.downloadingNext) {
        navigate(nextChapterUrl);
      }
    } catch {
      chapter.setError("Falha em exibir o proximo capitulo");
    }
  }, [chapter.chapterId, chapter.currentPage]);

  const prevChapter = useCallback(async () => {
    try {
      const prevChapterUrl = await window.electron.chapters.getPrevChapter(
        chapter.serieName,
        Number(chapter.chapterId)
      );
      navigate(prevChapterUrl);
    } catch {
      chapter.setError("Falha em exibir o capitulo anterior");
    }
  }, [chapter.chapterId, chapter.currentPage]);

  const nextPage = useCallback(async () => {
    try {
      const newPage = chapter.currentPage + 1;

      if (newPage <= chapter.quantityPages) {
        if (
          newPage >= Math.round(chapter.quantityPages / 2) &&
          chapter.downloadingNext
        ) {
          await chapter.triggerDownload();
        }
        chapter.setCurrentPage(newPage);
      } else {
        await nextChapter();
      }
    } catch (error) {
      chapter.setError("Falha ao avançar páginas");
    }
  }, [chapter.currentPage, chapter.quantityPages]);

  const prevPage = useCallback(async () => {
    try {
      if (chapter.currentPage > 0) {
        chapter.setCurrentPage(chapter.currentPage - 1);
      } else {
        // Preciso de um safe back
        prevChapter();
      }
    } catch {
      chapter.setError("Falha ao retroceder páginas");
    }
  }, [chapter.currentPage, chapter.pages]);

  return { nextChapter, nextPage, prevChapter, prevPage };
}
