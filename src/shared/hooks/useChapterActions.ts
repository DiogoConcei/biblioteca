import useSerieStore from '@/shared/store/useSerieStore';
import { LiteratureChapter } from '../../../electron/types/electron-auxiliar.interfaces';

export default function useChapterActions() {
  const deleteChapter = async (
    chapter: LiteratureChapter,
  ): Promise<{ success: boolean; error?: string }> => {
    const dataPath = useSerieStore.getState().serie?.dataPath;
    if (!dataPath) return { success: false, error: 'Série não carregada.' };

    try {
      // TODO: troque pela chamada que a página de edição já usa para excluir capítulos.
      // const response = await window.electronAPI.chapters.deleteChapter(dataPath, chapter.id);
      // return response.success
      //   ? { success: true }
      //   : { success: false, error: response.error };
      return { success: false, error: 'Exclusão ainda não ligada ao backend.' };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  };

  return { deleteChapter };
}
