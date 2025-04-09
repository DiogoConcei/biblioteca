import { useNavigate } from "react-router-dom";
import { Manga, MangaChapter } from "../types/manga.interfaces";
import { LiteratureChapter } from "../types/series.interfaces";
import { userActionProps } from "../types/customHooks.interfaces";

export default function useAction({ dataPath }: userActionProps) {
  const navigate = useNavigate();

  async function ratingSerie(dataPath: string, ratingIndex: number) {
    try {
      await window.electron.userAction.ratingSerie(dataPath, ratingIndex);
    } catch (error) {
      console.error("Erro ao atualizar o rating:", error);
      throw error;
    }
  }

  async function markAsRead(
    e: React.MouseEvent<HTMLElement>,
    chapter: LiteratureChapter,
    chapter_id: number,
    updateChapter: (path: string, newValue: any) => Promise<void>
  ) {
    e.stopPropagation();
    const originalIsRead = chapter.isRead;
    const path = `chapters.${chapter_id}.isRead`;

    updateChapter(path, !originalIsRead);

    try {
      const response = await window.electron.userAction.markRead(
        dataPath,
        chapter_id,
        !originalIsRead
      );

      if (!response.success) {
        updateChapter(path, originalIsRead);
        return false;
      }

      return true;
    } catch (e) {
      updateChapter(path, originalIsRead);
      console.error("Falha em realizar ação");
      return false;
    }
  }

  async function openChapter(
    e: React.MouseEvent<HTMLDivElement>,
    manga: Manga,
    chapter: MangaChapter
  ) {
    e.stopPropagation();

    const { name: serieName, id: serieId } = manga;
    const { name: chapterName, id: chapterId, page, isRead } = chapter;

    const safeOpen = await window.electron.download.checkDownload(
      serieName,
      chapterId
    );

    console.log(`Da pra abrir ?: ${safeOpen}`);
    console.log(
      `Url montada: /${serieName}/${serieId}/${chapterName}/${chapterId}/${page.lastPageRead}/${isRead}`
    );

    if (safeOpen) {
      navigate(
        `/${serieName}/${serieId}/${chapterName}/${chapterId}/${page.lastPageRead}/${isRead}`
      );
    }
  }

  return { ratingSerie, markAsRead, openChapter };
}
