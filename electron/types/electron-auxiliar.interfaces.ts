import { Manga, MangaChapter } from './manga.interfaces';
import { Comic, ComicEdition } from './comic.interfaces';
import { Collection } from '../../src/types/collections.interfaces';
import { TieIn } from './comic.interfaces';
import {
  FieldError,
  Control,
  FieldValues,
  Path,
  UseFormRegisterReturn,
} from 'react-hook-form';
import { SerieEditForm, SerieForm } from '../../src/types/series.interfaces';

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
  msg: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
}

export interface FormInputProps {
  register: UseFormRegisterReturn;
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

export interface BackupMeta {
  id: string;
  path: string;
  createdAt: string;
  description?: string;
  encrypted?: boolean;
}

export interface LocalSettings {
  backupAuto: boolean;
  backupSchedule: { frequency: 'daily' | 'weekly' | 'monthly'; time: string };
  backupRetention: number;
  uploadBackupsToDrive: boolean;
  themeMode: 'light' | 'dark' | 'system';
  accentColor: string;
  compactMode: boolean;
  sendLogsWithBugReport: boolean;
  driveConnected: boolean;
}

export interface ComicCoverRegenerationProgress {
  total: number;
  processed: number;
  currentComic?: string;
  regenerated: number;
  skipped: number;
  failed: number;
}

export interface ComicCoverRegenerationResult {
  total: number;
  processed: number;
  regenerated: number;
  skipped: number;
  failed: number;
  failures: Array<{ comic: string; reason: string }>;
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

export type ReadableSerie = Literatures | TieIn;

export type Status = 'Em andamento' | 'Completo' | 'Pendente' | '';

export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface LocalSettings {
  backupAuto: boolean;
  backupSchedule: {
    frequency: BackupFrequency;
    time: string;
  };
  backupRetention: number;
  uploadBackupsToDrive: boolean;
  themeMode: ThemeMode;
  accentColor: string;
  compactMode: boolean;
  sendLogsWithBugReport: boolean;
  driveConnected: boolean;
}

export interface BackupMeta {
  id: string;
  path: string;
  createdAt: string;
  description?: string;
  encrypted?: boolean;
}

export interface ComicCoverRegenerationProgress {
  total: number;
  processed: number;
  currentComic?: string;
  regenerated: number;
  skipped: number;
  failed: number;
}

export interface ComicCoverRegenerationResult {
  total: number;
  processed: number;
  regenerated: number;
  skipped: number;
  failed: number;
  failures: Array<{ comic: string; reason: string }>;
}

export interface LastReadCandidate {
  serie: ReadableSerie;
  chapterId: number;
  lastPageRead: number;
  isRead: boolean;
  timestamp: number;
}
