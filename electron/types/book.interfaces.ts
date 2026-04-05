import { graphChapter, graphSerie } from './electron-auxiliar.interfaces';
import {
  LiteratureForm,
  ReadingStatus,
} from '../../src/types/series.interfaces';

export interface Book extends graphSerie<BookChapter> {
  name: string;
  sanitizedName: string;
  genre?: string;
  author?: string;
  language?: string;
  coverImage: string;
  archivesPath: string;
  chaptersPath: string;
  dataPath: string;
  chapters: BookChapter[];
  totalChapters: number;
  chaptersRead: number;
  literatureForm: LiteratureForm.BOOK;
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

export interface BookChapter extends graphChapter {
  id: number;
  serieName: string;
  name: string;
  sanitizedName: string;
  archivesPath: string;
  chapterPath: string;
  createdAt: string;
  isRead: boolean;
  isDownloaded: 'not_downloaded' | 'downloading' | 'downloaded';
  page: {
    lastPageRead: number;
    favoritePage: number;
  };
}
