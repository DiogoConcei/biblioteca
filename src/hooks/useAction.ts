import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import {
  LiteratureChapter,
  LiteratureChapterAttributes,
  Literatures,
} from '../types/auxiliar.interfaces';
import useSerie from './useSerie';
import { TieIn } from 'electron/types/comic.interfaces';

type DownloadStatus = 'not_downloaded' | 'downloading' | 'downloaded';

export default function useAction(dataPath: string) {
  const navigate = useNavigate();
  const { updateChapter } = useSerie();
  const [error, setError] = useState<string | null>(null);

  async function ratingSerie(dataPath: string, ratingIndex: number) {
    try {
      await window.electronAPI.series.ratingSerie(dataPath, ratingIndex);
    } catch (error) {
      console.error('Erro ao atualizar o rating:', error);
      throw error;
    }
  }

  async function markAsRead(
    e: React.MouseEvent<HTMLElement>,
    chapter: LiteratureChapter,
    id: number,
    updateChapter: (
      index: number,
      path: string,
      newValue: LiteratureChapterAttributes,
    ) => void,
  ) {
    e.stopPropagation();

    const originalIsRead = chapter.isRead;

    updateChapter(id, 'isRead', !originalIsRead);

    try {
      const response = await window.electronAPI.userAction.markRead(
        dataPath,
        chapter.id,
        !originalIsRead,
      );

      if (!response.success) {
        updateChapter(id, 'isRead', originalIsRead);
      }
    } catch (e) {
      updateChapter(id, 'isRead', originalIsRead);
      console.error('Falha em realizar ação');
    }
  }

  interface DownloadIndividualFn {
    (
      dataPath: string,
      chapterId: number,
      edition: LiteratureChapter,
      updateChapter: (
        index: number,
        path: string,
        newValue: LiteratureChapterAttributes,
      ) => void,
    ): void;
  }

  async function openChapter(
    e: React.MouseEvent<HTMLDivElement>,
    serie: Literatures | TieIn,
    edition: LiteratureChapter,
    downloadIndividual: DownloadIndividualFn,
  ): Promise<void> {
    e.stopPropagation();
    const { name: serieName, id: serieId } = serie;
    const { name: chapterName, id: chapterId, page, isRead } = edition;

    const safeOpen: boolean = await window.electronAPI.download.checkDownload(
      serieName,
      chapterId,
    );

    if (safeOpen) {
      navigate(
        `/${encodeURIComponent(serieName)}/${serieId}/${encodeURIComponent(
          chapterName,
        )}/${chapterId}/${page.lastPageRead}/${isRead}`,
      );
    } else {
      downloadIndividual(serie.dataPath, edition.id, edition, updateChapter);
    }
  }

  return { ratingSerie, markAsRead, openChapter };
}
