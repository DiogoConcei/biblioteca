import { Comic } from 'electron/types/comic.interfaces';
import { Manga } from 'electron/types/manga.interfaces';
import { Book } from 'electron/types/book.interfaces';

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
  createdAt: string;
  oldPath: string;
  deletedAt: string;
}

export interface SeriesTypes {
  serie: Comic | Manga | Book;
}
