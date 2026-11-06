import { useNavigate } from 'react-router-dom';

import { useUIStore } from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import useSettingsStore from '../store/useSettingsStore';
import { ChapterView } from '../../../electron/types/electron-auxiliar.interfaces';
import { APIResponse } from '../../../electron/types/electron-auxiliar.interfaces';
import useDownload from './useDownload';

export default function useNavigation(currentChapter: ChapterView) {
  const clearSerie = useSerieStore((state) => state.clearSerie);
  const setError = useUIStore((state) => state.setError);
  const { downloadInReading } = useDownload();
  const navigate = useNavigate();

  const readingMode = useSettingsStore((state) => state.settings.viewer.readingMode);
  const step = readingMode === 'double' ? 2 : 1;

  const saveProgress = async () => {
    const { serie } = useSerieStore.getState();

    try {
      await window.electronAPI.chapters.saveLastRead(
        currentChapter.serieName,
        currentChapter.id,
        currentChapter.currentPage,
        currentChapter.quantityPages,
      );

      if (serie?.dataPath) {
        await window.electronAPI.history.addToHistory(serie.dataPath, currentChapter.id);
      }
    } catch (e) {
      console.error('Erro ao salvar progresso:', e);
    }
  };

  const nextPage = async () => {
    try {
      if (currentChapter.currentPage + step < currentChapter.quantityPages) {
        currentChapter.setCurrentPage(currentChapter.currentPage + step);
      } else {
        await nextChapter();
      }
    } catch (e) {
      setError('Erro ao navegar para a próxima página.');
    }
  };

  const prevPage = async () => {
    try {
      if (currentChapter.currentPage - step >= 0) {
        currentChapter.setCurrentPage(currentChapter.currentPage - step);
      } else if (currentChapter.currentPage > 0) {
        // Se estivermos na página 1 em modo double, volta para 0
        currentChapter.setCurrentPage(0);
      } else {
        await prevChapter();
      }
    } catch (e) {
      setError('Erro ao navegar para a página anterior.');
    }
  };

  const nextChapter = async () => {
    if (currentChapter.isLoading) return;

    // Acessa o estado mais recente via getState() para evitar stale closures
    const { chapters } = useSerieStore.getState();
    const currentIndex = chapters.findIndex(
      (ch) => Number(ch.id) === Number(currentChapter.id),
    );

    if (currentIndex === -1 || currentIndex >= chapters.length - 1) {
      currentChapter.setIsLoading(false);
      return;
    }

    currentChapter.setIsLoading(true);

    try {
      const nextChapterData = chapters[currentIndex + 1];

      const ok =
        nextChapterData.isDownloaded === 'downloaded' ||
        (await downloadInReading(nextChapterData));
      if (!ok) throw new Error('download falhou');

      const res = await window.electronAPI.chapters.getNextChapter(
        nextChapterData.serieName,
        nextChapterData.id,
      );
      if (!res.success || !res.data) throw new Error(res.error);

      await saveProgress();
      navigate(res.data.url);
    } catch (e) {
      setError('Falha ao solicitar o próximo capítulo.');
    } finally {
      currentChapter.setIsLoading(false);
    }
  };

  const prevChapter = async () => {
    if (currentChapter.isLoading) return;

    const { chapters } = useSerieStore.getState();
    const currentIndex = chapters.findIndex(
      (ch) => Number(ch.id) === Number(currentChapter.id),
    );

    if (currentIndex <= 0) return;

    currentChapter.setIsLoading(true);

    try {
      const prevChapterData = chapters[currentIndex - 1];

      const ok =
        prevChapterData.isDownloaded === 'downloaded' ||
        (await downloadInReading(prevChapterData));
      if (!ok) throw new Error('download falhou');

      const res = await window.electronAPI.chapters.getPrevChapter(
        prevChapterData.serieName,
        prevChapterData.id,
      );
      if (!res.success || !res.data) throw new Error(res.error);

      await saveProgress();
      navigate(res.data.url);
    } catch (e) {
      setError('Falha ao solicitar o capítulo anterior.');
    }
  };

  const goHome = async () => {
    await saveProgress();
    clearSerie();
    navigate('/');
  };

  const goToSeriePage = async () => {
    await saveProgress();
    const { serie } = useSerieStore.getState();

    if (serie?.dataPath) {
      const toSeriePage = await window.electronAPI.userAction.returnPage(
        serie.dataPath,
        currentChapter.serieName,
      );

      const seriePage = toSeriePage.data;
      if (seriePage) navigate(seriePage);
    }
  };

  return {
    nextPage,
    prevPage,
    nextChapter,
    prevChapter,
    goHome,
    goToSeriePage,
  };
}
