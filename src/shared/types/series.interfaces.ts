import { Comic } from 'electron/types/comic.interfaces';
import { Manga } from 'electron/types/manga.interfaces';

import { LiteratureChapter } from '../../electron/types/electron-auxiliar.interfaces';

export enum ReadingStatus {
  IN_PROGRESS = 'Em andamento',
  COMPLETED = 'Completo',
  PENDING = 'Pendente',
  NONE = '',
}

export enum LiteratureForm {
  MANGA = 'Manga',
  COMIC = 'Quadrinho',
  BOOK = 'Books',
  NONE = '',
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
  privacy: 'Publica' | 'Privada' | '';
  autoBackup: 'Sim' | 'Não' | '';
  readingStatus: ReadingStatus;
  sanitizedName: string;
  chaptersPath: string;
  oldPath: string;
  archivesPath: string;
  createdAt: string;
  deletedAt: string;
}

export interface SerieEditForm {
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
    privacy: 'Publica' | 'Privada' | '';
    rating?: number;
    isFavorite: boolean;
    autoBackup: 'Sim' | 'Não' | '';
  };
  comments: string[];
  tags: string[];
  deletedAt: string;
  createdAt: string;
}

export interface SeriesTypes {
  serie: Comic | Manga;
}
