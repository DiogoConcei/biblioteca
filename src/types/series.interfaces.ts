import { Comic } from 'electron/types/comic.interfaces';
import { Manga } from 'electron/types/manga.interfaces';
import { Book } from 'electron/types/book.interfaces';
import { LiteratureChapter } from './auxiliar.interfaces';

export interface SerieData {
  name: string;
  sanitizedName: string;
  newPath: string;
  oldPath: string;
  chaptersPath: string;
  createdAt: string;
  collections: string[];
  deletedAt: string;
}

export interface SerieForm {
  name: string;
  genre?: string;
  author?: string;
  language?: string;
  cover_path: string;
  literatureForm: 'Manga' | 'Quadrinho' | 'Livro' | '';
  collections: string[];
  tags: string[];
  privacy: 'Publica' | 'Privada' | '';
  autoBackup: 'Sim' | 'Não' | '';
  readingStatus: 'Em andamento' | 'Completo' | 'Pendente' | '';
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
  literatureForm: 'Manga' | 'Quadrinho' | 'Livro' | '';
  readingData: {
    lastChapterId: number;
    lastReadAt: string;
  };
  metadata: {
    status: 'Em andamento' | 'Completo' | 'Pendente' | '';
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
  serie: Comic | Manga | Book;
}
