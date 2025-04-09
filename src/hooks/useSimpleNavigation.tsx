import {
  useChapterReturn,
  useSimpleNavigationReturn,
} from "../types/customHooks.interfaces";
import useDownload from "./useDownload";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function useSimpleNavigation(
  chapter: useChapterReturn
): useSimpleNavigationReturn {
  const navigate = useNavigate();

  const { downloadInReading } = useDownload({
    setError: chapter.setError,
    setDownloaded: chapter.setDownloaded,
  });

  const nextChapter = useCallback(async () => {
    if (!chapter.isNextDownloaded.current) {
      await downloadInReading({
        serieName: chapter.serieName,
        chapterId: chapter.chapterId + 1,
        alreadyDownloaded: chapter.isNextDownloaded,
      });
    }

    if (!chapter.error) {
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

        if (chapter.isNextDownloaded.current) {
          navigate(nextChapterUrl);
        }
      } catch {
        chapter.setError("Falha em exibir o proximo capitulo");
      }
    }
  }, [
    chapter.chapterId,
    chapter.currentPage,
    chapter.isNextDownloaded,
    chapter.isPrevDownloaded,
  ]);

  const prevChapter = useCallback(async () => {
    await downloadInReading({
      serieName: chapter.serieName,
      chapterId: chapter.chapterId - 1,
      alreadyDownloaded: chapter.isPrevDownloaded,
    });

    if (!chapter.error) {
      try {
        const prevChapterUrl = await window.electron.chapters.getPrevChapter(
          chapter.serieName,
          Number(chapter.chapterId)
        );

        await window.electron.chapters.saveLastRead(
          chapter.serieName,
          chapter.chapterId,
          chapter.currentPage
        );

        if (chapter.isPrevDownloaded) {
          navigate(prevChapterUrl);
        }
      } catch {
        chapter.setError("Falha em exibir o capitulo anterior");
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
      chapter.setError("falha em localizar próxima a página");
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
      chapter.setError("Falha ao retroceder páginas");
    }
  }, [chapter.currentPage, chapter.pages]);

  return { nextChapter, nextPage, prevChapter, prevPage };
}
