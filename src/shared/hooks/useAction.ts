import { useNavigate } from 'react-router-dom';
import { TieIn, ComicTieIn } from '../../../electron/types/comic.interfaces';

import { useUIStore } from '../store/useUIStore';
import useSerieStore, { StoreSerie } from '../store/useSerieStore';
import {
  LiteratureChapter,
  Literatures,
} from '../../../electron/types/electron-auxiliar.interfaces';
import { useHistoryStore } from '../store/useHistoryStore';
import useCollection from './useCollection';
import { useCollectionStore } from '../store/useCollectionStore';

export default function useAction() {
  const serie = useSerieStore((state) => state.serie) as Literatures | TieIn;
  const clearSerie = useSerieStore((state) => state.clearSerie);
  const updateChapter = useSerieStore((state) => state.updateChapter);
  const updateSerie = useSerieStore((state) => state.updateSerie);
  const setLoading = useUIStore((state) => state.setLoading);
  const setError = useUIStore((state) => state.setError);
  const navigate = useNavigate();
  const setSerie = useSerieStore((state) => state.setSerie);
  const upsertRecent = useHistoryStore((s) => s.upsertRecent);
  const setRecentHistory = useHistoryStore((s) => s.setRecentHistory);
  const setCollection = useCollectionStore((s) => s.setCollection);
  const updateSerieInCollection = useCollectionStore((s) => s.updateSerieInCollection);
  const { updateFav } = useCollection();

  const ratingSerie = async (e: React.MouseEvent, serie: StoreSerie, rating: number) => {
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
  };

  const markAsRead = async (
    e: React.MouseEvent,
    selectedChapter: LiteratureChapter,
  ): Promise<boolean> => {
    e.stopPropagation();

    const originalRead = selectedChapter.isRead;

    if (serie) {
      const newValue = serie.chaptersRead + (selectedChapter.isRead ? -1 : 1);
      updateSerie('chaptersRead', newValue);
      updateSerie('readingData.lastChapterId', selectedChapter.id);

      if (newValue === serie.totalChapters) {
        updateSerie('metadata.status', 'Completo');
      } else if (newValue > 0) {
        updateSerie('metadata.status', 'Em andamento');
      } else {
        updateSerie('metadata.status', 'Pendente');
      }
    }

    updateChapter(selectedChapter.id, 'isRead', !originalRead);

    if (!originalRead && serie) {
      const { chapters } = useSerieStore.getState();
      upsertRecent({
        serieId: serie.id,
        serieName: serie.name,
        coverImage: serie.coverImage,
        literatureForm: serie.literatureForm,
        lastChapterId: selectedChapter.id,
        lastChapterLabel: selectedChapter.chapterNumber.label,
        lastReadAt: new Date().toISOString(),
        chaptersRead: chapters.filter((c) => c.isRead).length,
        totalChapters: serie.totalChapters,
      });
    }

    try {
      const response = await window.electronAPI.userAction.markRead(
        serie.dataPath,
        selectedChapter.id,
        !originalRead,
      );

      if (!response.success) {
        updateChapter(selectedChapter.id, 'isRead', originalRead);
        return false;
      }

      updateSerieInCollection(serie);
      if (response.data) {
        setCollection(response.data.recents);
        setRecentHistory(response.data.history);
      }
      return true;
    } catch (e) {
      updateChapter(selectedChapter.id, 'isRead', originalRead);
      return false;
    }
  };

  const openChapter = async (e: React.MouseEvent, selectedChapter: LiteratureChapter) => {
    e.stopPropagation();
    const { name: serieName, id: serieId } = serie;
    const { name: chapterName, id: chapterId, page, isRead } = selectedChapter;
    const result = await window.electronAPI.history.addToHistory(
      serie.dataPath,
      chapterId,
    );

    if (!result.success) {
      setError(`Não foi possível registar a série no histórico de recentes`);
    }

    updateSerie('readingData.lastChapterId', chapterId);
    updateSerie('readingData.lastReadAt', new Date().toISOString());

    if (serie.metadata.status === 'Pendente') {
      updateSerie('metadata.status', 'Em andamento');
    }

    navigate(
      `/${encodeURIComponent(serieName)}/${serieId}/${encodeURIComponent(
        chapterName,
      )}/${chapterId}/${page}/${isRead}`,
    );
  };

  const OpenLastChapter = async (
    e: React.MouseEvent<HTMLButtonElement | SVGElement>,
    serieId: number = serie.id,
  ) => {
    e.preventDefault();
    setLoading(true);

    const response = await window.electronAPI.chapters.acessLastRead(serieId);

    if (!response.success || !response.data) {
      setLoading(false);
      return setError(`${response.error}`);
    }

    const { url, serie } = response.data;

    setSerie(serie);

    if (url) {
      navigate(url);
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

  const favoriteSerie = async (isFav: boolean) => {
    const newFavoriteStatus = !isFav;
    updateSerie('metadata.isFavorite', newFavoriteStatus);
    const response = await updateFav(serie, newFavoriteStatus);

    if (!response) {
      updateSerie('metadata.isFavorite', isFav);
    }
  };

  return {
    ratingSerie,
    markAsRead,
    openChapter,
    openTieIn,
    OpenLastChapter,
    favoriteSerie,
  };
}
