export interface Book {
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
  literatureForm: 'Manga' | 'Quadrinho' | 'Livro' | '';
  readingData: {
    lastChapterId: number;
    lastReadAt: string;
  };
  chapters: BookPage[];
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
  deletedAt: string;
  tags: string[];
  createdAt: string;
  comments: string[];
}

export interface BookPage {
  id: number;
  name: string;
  sanitizedName: string;
  archivesPath: string;
  chapterPath: string;
  createdAt: string;
  isRead: boolean;
  isDownload: boolean;
  page: {
    lastPageRead: number;
    favoritePage: number;
  };
}

export interface BookConfig {
  config: {
    settings: {
      readingMode: 'single_page' | 'double_page' | 'vertical_scroll';
      zoom: 'fit_width' | 'fit_height' | 'original_size';
      lightMode: boolean;
      fullScreen: boolean;
    };
  };
}
