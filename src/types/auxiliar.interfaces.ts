import { Manga, MangaChapter } from '../../electron/types/manga.interfaces';
import { Comic, ComicEdition } from '../../electron/types/comic.interfaces';
import { Collection } from './collections.interfaces';
import {
  UseFormRegister,
  FieldError,
  Control,
  FieldValues,
  Path,
} from 'react-hook-form';
import { SerieEditForm } from './series.interfaces';

export type LiteratureChapter = ComicEdition | MangaChapter;

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

export type DownloadStatus = 'not_downloaded' | 'downloading' | 'downloaded';

export type Literatures = Manga | Comic;

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

export type LiteratureForms = 'Manga' | 'Quadrinho';

export type LiteratureChapterAttributes = string | number | boolean;

export interface FormTextInputProps {
  name: string;
  msg: string;
  register: UseFormRegister<any>;
  error?: FieldError;
}

export interface FormInputProps {
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
}

export interface FormControllerProps<T extends FieldValues = FieldValues> {
  control: Control<SerieEditForm>;
  label?: string;
}

export interface GenericControllerProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  name: Path<T>;
}

export interface FavoriteProps {
  serie: Literatures;
  setFavorites: React.Dispatch<React.SetStateAction<Collection | undefined>>;
}

export interface RatingProps {
  serie: Literatures;
}

export interface ChapterView {
  id: number;
  serieName: string;
  chapterName: string;
  isLoading: boolean;
  isDownloaded: DownloadStatus;
  pages: string[];
  quantityPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}
