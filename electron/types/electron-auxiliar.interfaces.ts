import { Manga, MangaChapter } from './manga.interfaces';
import { Comic, ComicEdition } from './comic.interfaces';
import { Collection } from '../../src/types/collections.interfaces';
import { TieIn } from './comic.interfaces';

export interface NormalizedSerieData {
  id: number;
  name: string;
  coverImage: string;
  archivesPath: string;
  chaptersPath: string;
  totalChapters: number;
  status: 'Em andamento' | 'Completo' | 'Pendente' | '';
  isFavorite: boolean;
  collections: string[];
  recommendedBy?: string;
  originalOwner?: string;
  rating?: number;
}

export interface viewData {
  id: number;
  name: string;
  coverImage: string;
  chaptersRead: number;
  dataPath: string;
  totalChapters: number;
  literatureForm: 'Manga' | 'Quadrinho' | 'Livro' | '';
}

export type Literatures = Manga | Comic;

export type LiteratureChapter = ComicEdition | MangaChapter;

export type LiteratureForms = 'Manga' | 'Quadrinho';

export type LiteratureChapterAttributes = string | number | boolean;

export type LiteraturesAttributes =
  | string
  | number
  | boolean
  | 'Manga'
  | 'Quadrinho'
  | 'Livro'
  | ''
  | 'Em andamento'
  | 'Completo'
  | 'Pendente'
  | 'Publica'
  | 'Privada'
  | 'Sim'
  | 'Não';

export type ReadableSerie = Literatures | TieIn;

export interface AppConfig {
  settings: {
    reading_mode: 'single_page' | 'double_page' | 'vertical_scroll';
    zoom: 'fit_width' | 'fit_height' | 'original_size';
    ligth_mode: boolean;
    full_screen: boolean;
  };
  metadata: {
    global_id: number;
  };
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LastReadCandidate {
  serie: ReadableSerie;
  chapterId: number;
  lastPageRead: number;
  isRead: boolean;
  timestamp: number;
}

export type Status = 'Em andamento' | 'Completo' | 'Pendente' | '';
