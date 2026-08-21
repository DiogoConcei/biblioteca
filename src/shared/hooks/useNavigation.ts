import { useNavigate } from 'react-router-dom';

import { useUIStore } from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import useSettingsStore from '../store/useSettingsStore';
import { ChapterView } from '../../../electron/types/electron-auxiliar.interfaces';
import useDownload from './useDownload';

export default function useNavigation(currentChapter: ChapterView) {
  const clearSerie = useSerieStore((state) => state.clearSerie);
  const setError = useUIStore((state) => state.setError);
  const { downloadInReading } = useDownload();
  const navigate = useNavigate();

  const readingMode = useSettingsStore(
    (state) => state.settings.viewer.readingMode,
  );
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
        await window.electronAPI.series.recentSerie(
          serie.dataPath,
          currentChapter.serieName,
        );
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

      let isDownloaded = nextChapterData.isDownloaded === 'downloaded';

      if (!isDownloaded) {
        // downloadInReading retorna boolean, usamos o retorno em vez de confiar no objeto local
        isDownloaded = await downloadInReading(nextChapterData);
      }

      const response = await window.electronAPI.chapters.getNextChapter(
        nextChapterData.serieName,
        nextChapterData.id,
      );

      const nextChapterUrl = response.data;

      await saveProgress();

      if (isDownloaded && nextChapterUrl) {
        navigate(nextChapterUrl);
      }
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

    try {
      const prevChapterData = chapters[currentIndex - 1];

      let isDownloaded = prevChapterData.isDownloaded === 'downloaded';

      if (!isDownloaded) {
        isDownloaded = await downloadInReading(prevChapterData);
      }

      const response = await window.electronAPI.chapters.getPrevChapter(
        prevChapterData.serieName,
        prevChapterData.id,
      );
      const prevChapterUrl = response.data;
      await saveProgress();
      if (isDownloaded && prevChapterUrl) {
        navigate(prevChapterUrl);
      }
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
