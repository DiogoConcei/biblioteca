import {
  LiteratureForm,
  ReadingStatus,
  AutoBackupStatus,
  PrivacyStatus,
} from '@/shared/types/series.interfaces';

export interface graphSerie<C extends graphChapter = graphChapter> {
  id: number;
  name: string;
  sanitizedName: string;
  description?: string;
  genre?: string;
  author?: string;
  language?: string;
  coverImage: string;
  archivesPath: string;
  chaptersPath: string;
  dataPath: string;
  chapters: C[];
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
    privacy: PrivacyStatus;
    rating?: number;
    isFavorite: boolean;
    autoBackup: AutoBackupStatus;
    compiledComic?: boolean;
  };
  comments: string[];
  tags: string[];
  deletedAt: string;
  createdAt: string;
}

export interface graphChapter {
  id: number; // unico
  order: number; // posição
  chapterNumber: {
    // exibição
    label: string;
    value: number;
  };
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
