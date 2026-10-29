import { LiteratureForm } from '../../../src/shared/types/series.interfaces';
import MangaManager from '../content/MangaManager';
import ComicManager from '../content/ComicManager';
import BookManager from '../content/BookManager';

export interface ChapterDownloader {
  createChapterById(dataPath: string, chapterId: number): Promise<void>;
}

const builders: Record<LiteratureForm, () => ChapterDownloader> = {
  [LiteratureForm.MANGA]: () => new MangaManager(),
  [LiteratureForm.COMIC]: () => new ComicManager(),
  [LiteratureForm.BOOK]: () => new BookManager(),
};

const instances = new Map<LiteratureForm, ChapterDownloader>();

export default class ManagerFactory {
  public static get(form: LiteratureForm): ChapterDownloader {
    let manager = instances.get(form);

    if (!manager) {
      manager = builders[form]();
      instances.set(form, manager);
    }

    return manager;
  }
}
