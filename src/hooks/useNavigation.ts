import { useNavigate } from 'react-router-dom';

import { useUIStore } from '../store/useUIStore';
import useSerieStore from '../store/useSerieStore';
import { ChapterView } from '../../electron/types/electron-auxiliar.interfaces';
import useDownload from './useDownload';

export default function useNavigation(currentChapter: ChapterView) {
  const chapters = useSerieStore((state) => state.chapters);
  const setError = useUIStore((state) => state.setError);
  const { downloadInReading } = useDownload();
  const navigate = useNavigate();

  const nextPage = async () => {
    try {
      if (currentChapter.currentPage < currentChapter.quantityPages - 1) {
        currentChapter.setCurrentPage(currentChapter.currentPage + 1);
      } else {
        await nextChapter();
      }
    } catch (e) {
      setError('Erro ao navegar para a próxima página.');
    }
  };

  const prevPage = async () => {
    try {
      if (currentChapter.currentPage > 0) {
        currentChapter.setCurrentPage(currentChapter.currentPage - 1);
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

      await window.electronAPI.chapters.saveLastRead(
        currentChapter.serieName,
        currentChapter.id,
        currentChapter.currentPage,
        currentChapter.quantityPages,
      );

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
      await window.electronAPI.chapters.saveLastRead(
        currentChapter.serieName,
        currentChapter.id,
        currentChapter.currentPage,
        currentChapter.quantityPages,
      );
      if (prevChapter.isDownloaded === 'downloaded' && prevChapterUrl) {
        navigate(prevChapterUrl);
      }
    } catch (e) {
      setError('Falha ao solicitar o próximo capítulo.');
    }
  };

  return { nextPage, prevPage, nextChapter, prevChapter };
}
