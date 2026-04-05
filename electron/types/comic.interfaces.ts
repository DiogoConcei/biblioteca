import { graphChapter, graphSerie } from './electron-auxiliar.interfaces';
import {
  LiteratureForm,
  ReadingStatus,
} from '../../src/types/series.interfaces';

export interface Comic extends graphSerie<ComicEdition> {
  id: number;
  name: string;
  sanitizedName: string;
  archivesPath: string;
  chaptersPath: string;
  dataPath: string;
  coverImage: string;
  totalChapters: number;
  chaptersRead: number;
  genre?: string;
  author?: string;
  language?: string;
  literatureForm: LiteratureForm;
  readingData: {
    lastChapterId: number;
    lastReadAt: string;
  };
  chapters: ComicEdition[];
  childSeries?: ComicTieIn[];
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
    compiledComic: boolean;
  };
  createdAt: string;
  deletedAt: string;
  tags: string[];
  comments: string[];
}

export interface TieIn {
  id: number;
  name: string;
  sanitizedName: string;
  archivesPath: string;
  chaptersPath: string;
  dataPath: string;
  coverImage: string;
  totalChapters: number;
  chaptersRead: number;
  literatureForm: LiteratureForm;
  chapters?: ComicEdition[];
  readingData: {
    lastChapterId: number;
    lastReadAt: string;
  };
  metadata: {
    lastDownload: number;
    isFavorite: boolean;
    isCreated: boolean;
    status: ReadingStatus;
    rating?: number;
    recommendedBy?: string;
    originalOwner?: string;
  };
  createdAt: string;
  deletedAt?: string;
  comments: string[];
}

export interface ComicTieIn {
  serieName: string;
  archivesPath: string;
  dataPath: string;
  compiledComic: boolean;
  coverImage: string;
  id: number;
  parentId?: number;
}

export interface ComicEdition extends graphChapter {
  id: number;
  serieName: string;
  name: string;
  sanitizedName: string;
  coverImage?: string;
  archivesPath: string;
  chapterPath: string;
  createdAt: string;
  isRead: boolean;
  isDownloaded: 'not_downloaded' | 'downloading' | 'downloaded';
  page: {
    lastPageRead: number;
    favoritePage: number;
    lastCfi?: string;
  };
}

export interface ComicConfig {
  config: {
    settings: {
      readingMode: 'single_page' | 'double_page' | 'vertical_scroll';
      zoom: 'fit_width' | 'fit_height' | 'original_size';
      lightMode: boolean;
      fullScreen: boolean;
    };
  };
}
