import { useNavigate } from 'react-router-dom';

import { useUIStore } from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import useSettingsStore from '../store/useSettingsStore';
import { ChapterView } from '../../electron/types/electron-auxiliar.interfaces';
import useDownload from './useDownload';

export default function useNavigation(currentChapter: ChapterView) {
  const chapters = useSerieStore((state) => state.chapters);
  const serie = useSerieStore((state) => state.serie);
  const clearSerie = useSerieStore((state) => state.clearSerie);
  const setError = useUIStore((state) => state.setError);
  const { downloadInReading } = useDownload();
  const navigate = useNavigate();
  
  const readingMode = useSettingsStore((state) => state.settings.viewer.readingMode);
  const step = readingMode === 'double' ? 2 : 1;

  const saveProgress = async () => {
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

    currentChapter.setIsLoading(true);

    const nextChapterId = currentChapter.id + 1;

    if (nextChapterId > chapters.length) {
      currentChapter.setIsLoading(false);
      return;
    }

    try {
      const nextChapter =
        chapters.find((ch) => ch.id === nextChapterId) || chapters[0];

      if (nextChapter.isDownloaded === 'not_downloaded') {
        await downloadInReading(nextChapter);
      }

      const response = await window.electronAPI.chapters.getNextChapter(
        nextChapter.serieName,
        nextChapter.id,
      );

      const nextChapterUrl = response.data;

      await saveProgress();

      if (nextChapter.isDownloaded === 'downloaded' && nextChapterUrl) {
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

    const prevChapterId = currentChapter.id - 1;

    if (prevChapterId < 1) return;
    try {
      const prevChapter =
        chapters.find((ch) => ch.id === prevChapterId) || chapters[0];

      if (prevChapter.isDownloaded === 'not_downloaded') {
        await downloadInReading(prevChapter);
      }

      const response = await window.electronAPI.chapters.getPrevChapter(
        prevChapter.serieName,
        prevChapter.id,
      );
      const prevChapterUrl = response.data;
      await saveProgress();
      if (prevChapter.isDownloaded === 'downloaded' && prevChapterUrl) {
        navigate(prevChapterUrl);
      }
    } catch (e) {
      setError('Falha ao solicitar o próximo capítulo.');
    }
  };

  const goHome = async () => {
    await saveProgress();
    clearSerie();
    navigate('/');
  };

  const goToSeriePage = async () => {
    await saveProgress();
    if (serie?.dataPath) {
      const toSeriePage = await window.electronAPI.userAction.returnPage(
        serie.dataPath,
        currentChapter.serieName,
      );
      const seriePage = toSeriePage.data;
      if (seriePage) navigate(seriePage);
    }
  };

  return { nextPage, prevPage, nextChapter, prevChapter, goHome, goToSeriePage };
}
