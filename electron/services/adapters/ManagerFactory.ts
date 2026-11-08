import { LiteratureForm, SerieForm } from '../../../src/shared/types/series.interfaces';

export interface ChapterManager {
  createChapterById(dataPath: string, chapterId: number): Promise<void>;
  deleteChapterById(dataPath: string, chapterId: number): Promise<void>;
  createSerie(serie: SerieForm): Promise<void>;
}

export default class ManagerFactory {
  private static managers = new Map<LiteratureForm, ChapterManager>();

  static register(form: LiteratureForm, manager: ChapterManager) {
    this.managers.set(form, manager);
  }

  static get(form: LiteratureForm): ChapterManager {
    const manager = this.managers.get(form);
    if (!manager) throw new Error(`Tipo de literatura inválido: ${form}`);
    return manager;
  }
}
