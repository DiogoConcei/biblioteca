export interface Manga {
  id: number;
  name: string;
  sanitizedName: string;
  genre?: string;
  author?: string;
  language?: string;
  coverImage: string;
  archivesPath: string;
  chaptersPath: string;
  dataPath: string;
  chapters: MangaChapter[];
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

export interface MangaChapter {
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

export interface MangaConfig {
  config: {
    settings: {
      readingMode: 'single_page' | 'double_page' | 'vertical_scroll';
      zoom: 'fit_width' | 'fit_height' | 'original_size';
      lightMode: boolean;
      fullScreen: boolean;
    };
  };
}
