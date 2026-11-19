import { LiteratureForm } from './electron-auxiliar.interfaces';
import { ComicEdition } from './comic.interfaces';
import {
  ReadingStatus,
  PrivacyStatus,
  AutoBackupStatus,
} from '@/shared/types/series.interfaces';
import { ViewMode } from './electron-auxiliar.interfaces';

export interface TieIn {
  id: number;
  name: string;
  sanitizedName: string;
  archivesPath: string;
  chaptersPath: string;
  dataPath: string;
  serieGallery: string;
  coverGallery: string;
  pagesGallery: string;
  backgroundGallery: string;
  coverImage: string;
  totalChapters: number;
  chaptersRead: number;
  literatureForm: LiteratureForm;
  chapters: ComicEdition[];
  readingData: {
    lastChapterId: number;
    lastReadAt: string;
  };

  genre: string;
  author: string;
  language: string;
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
    compiledComic: boolean;
    isCreated: boolean;
    viewMode: ViewMode;
  };
  backgroundImage: string;
  description: string;
  createdAt: string;
  deletedAt: string;
  tags: string[];
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
