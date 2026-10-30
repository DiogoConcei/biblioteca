import { Comic } from '../../../electron/types/comic.interfaces';
import { Manga } from '../../../electron/types/manga.interfaces';
import {
  LiteratureChapter,
  ViewMode,
} from '../../../electron/types/electron-auxiliar.interfaces';

export enum ReadingStatus {
  IN_PROGRESS = 'Em andamento',
  COMPLETED = 'Completo',
  PENDING = 'Pendente',
}

export enum AutoBackupStatus {
  YES = 'Sim',
  NO = 'Não',
}

export enum PrivacyStatus {
  PUBLIC = 'Pública',
  PRIVATE = 'Privada',
}

export enum LiteratureForm {
  MANGA = 'Manga',
  COMIC = 'Quadrinho',
  BOOK = 'Books',
}

export interface SerieData {
  name: string;
  sanitizedName: string;
  newPath: string;
  oldPath: string;
  createdAt: string;
}

export interface SerieForm {
  name: string;
  genre?: string;
  author?: string;
  language?: string;
  cover_path: string;
  literatureForm: LiteratureForm;
  collections: string[];
  tags: string[];
  privacy: PrivacyStatus;
  autoBackup: AutoBackupStatus;
  readingStatus: ReadingStatus;
  sanitizedName: string;
  chaptersPath: string;
  description?: string;
  backgroundPath?: string;
  viewMode: ViewMode;
  oldPath: string;
  archivesPath: string;
  createdAt: string;
  deletedAt: string;
}

export interface SerieEditForm {
  id: number;
  name: string;
  sanitizedName: string;
  genre?: string;
  author?: string;
  language?: string;
  coverImage: string;
  archivesPath: string;
  chaptersPath: string;
  dataPath: string;
  chapters: LiteratureChapter[];
  totalChapters: number;
  chaptersRead: number;
  serieGallery: string;
  coverGallery: string;
  pagesGallery: string;
  literatureForm: LiteratureForm;
  readingData: {
    lastChapterId: number;
    lastReadAt: string;
  };
  metadata: {
    status: ReadingStatus;
    collections: string[];
    recommendedBy?: string;
    originalOwner?: string;
    lastDownload: number;
    privacy: PrivacyStatus;
    rating?: number;
    isFavorite: boolean;
    autoBackup: AutoBackupStatus;
  };
  comments: string[];
  tags: string[];
  deletedAt: string;
  createdAt: string;
}

export interface SeriesTypes {
  serie: Comic | Manga;
}
