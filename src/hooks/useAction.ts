import useUIStore from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import { TieIn, ComicTieIn } from 'electron/types/comic.interfaces';
import {
  LiteratureChapter,
  Literatures,
} from '../../electron/types/electron-auxiliar.interfaces';
import { useNavigate } from 'react-router-dom';
import { viewData } from '../../electron/types/electron-auxiliar.interfaces';
import useDownload from './useDownload';

export default function useAction() {
  const serie = useSerieStore((state) => state.serie) as Literatures | TieIn;
  const clearSerie = useSerieStore((state) => state.clearSerie);
  const dataPath = useSerieStore((state) => state.serie?.dataPath || '');
  const updateChapter = useSerieStore((state) => state.updateChapter);
  const updateSerie = useSerieStore((state) => state.updateSerie);
  const setLoading = useUIStore((state) => state.setLoading);
  const setError = useUIStore((state) => state.setError);
  const { downloadIndividual } = useDownload();
  const navigate = useNavigate();
  const setSerie = useSerieStore((state) => state.setSerie);

  async function ratingSerie(
    e: React.MouseEvent,
    serie: Literatures,
    rating: number,
  ) {
    e.stopPropagation();

    const originalRating = serie.metadata.rating;

    updateSerie('metadata.rating', rating);

    try {
      const response = await window.electronAPI.series.ratingSerie(
        serie.dataPath,
        rating,
      );

      if (!response.success) {
        updateSerie('metadata.rating', originalRating || 0);
      }
    } catch (e) {
      updateSerie('metadata.rating', originalRating || 0);
      console.error('Falha em realizar ação');
    }
  }

  async function markAsRead(
    e: React.MouseEvent,
    selectedChapter: LiteratureChapter,
  ) {
    e.stopPropagation();

    const originalRead = selectedChapter.isRead;

    if (selectedChapter.id !== 1 && serie) {
      const newValue = serie.chaptersRead + (selectedChapter.isRead ? -1 : 1);
      updateSerie('chaptersRead', newValue);
      updateSerie('readingData.lastChapterId', selectedChapter.id);
    }

    updateChapter(selectedChapter.id, 'isRead', !originalRead);

    try {
      const response = await window.electronAPI.userAction.markRead(
        dataPath,
        selectedChapter.id,
        !originalRead,
      );

      if (!response.success) {
        updateChapter(selectedChapter.id, 'isRead', originalRead);
      }
    } catch (e) {
      updateChapter(selectedChapter.id, 'isRead', originalRead);
      console.error('Falha em realizar ação');
    }
  }

  async function openChapter(
    e: React.MouseEvent,
    selectedChapter: LiteratureChapter,
  ) {
    e.stopPropagation();
    const { name: serieName, id: serieId } = serie;
    const { name: chapterName, id: chapterId, page, isRead } = selectedChapter;

    const safeOpen: boolean = await window.electronAPI.download.checkDownload(
      serieName,
      chapterId,
    );

    if (safeOpen) {
      navigate(
        `/${encodeURIComponent(serieName)}/${serieId}/${encodeURIComponent(
          chapterName,
        )}/${chapterId}/${page}/${isRead}`,
      );
    } else {
      downloadIndividual(e, selectedChapter);
    }
  }

  const lastChapter = async (
    e: React.MouseEvent<HTMLButtonElement | SVGElement>,
    serieId: number,
  ) => {
    e.preventDefault();
    setLoading(true);

    const response = await window.electronAPI.chapters.acessLastRead(serieId);

    if (!response.success || !response.data) {
      setLoading(false);
      return setError(`${response.error}`);
    }

    const [lastChapterUrl, serieData] = response.data;
    setSerie(serieData);

    if (lastChapterUrl) {
      navigate(lastChapterUrl);
      setLoading(false);
    } else {
      setLoading(false);
      setError('URL do último capítulo não encontrada.');
    }
  };

  const openTieIn = async (tieIn: ComicTieIn) => {
    setLoading(true);

    const response = await window.electronAPI.series.createTieIn(tieIn);

    if (!response.success) {
      console.error(response.error);
      return;
    }

    clearSerie();
    const url = response.data;

    setLoading(false);
    navigate(url!);
  };

  return { ratingSerie, markAsRead, openChapter, openTieIn, lastChapter };
}
