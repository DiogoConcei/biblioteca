import { LiteratureForm } from '../../../src/shared/types/series.interfaces';
import MangaManager from '../content/MangaManager';
import ComicManager from '../content/ComicManager';
import BookManager from '../content/BookManager';
import TieInManager from '../content/TieInManager';

export interface ChapterManager {
  createChapterById(dataPath: string, chapterId: number): Promise<void>;
  deleteChapterById(dataPath: string, chapterId: number): Promise<void>;
}

const builders: Record<LiteratureForm, () => ChapterManager> = {
  [LiteratureForm.MANGA]: () => new MangaManager(),
  [LiteratureForm.COMIC]: () => new ComicManager(),
  [LiteratureForm.BOOK]: () => new BookManager(),
  // [LiteratureForm.CHILD_SERIES]: () => new TieInManager(), // Adicionado caso exista no Enum
};

const instances = new Map<LiteratureForm, ChapterManager>();

export default class ManagerFactory {
  public static get(form: LiteratureForm): ChapterManager {
    let manager = instances.get(form);

    if (!manager) {
      manager = builders[form]();
      instances.set(form, manager);
    }

    return manager;
  }
}
