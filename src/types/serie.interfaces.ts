export interface ComicConfig {
  global_id: number;
  settings: {
    reading_mode: "single_page" | "double_page" | "vertical_scroll";
    zoom: "fit_width" | "fit_height" | "original_size";
  };
}

export interface ComicCollection {
  collections: Collections[];
}

export interface Collections {
  name: string;
  description: string;
  comics: ComicCollectionInfo[];
  comments: string[];
}

export interface ComicCollectionInfo {
  id: number,
  name: string,
  cover_image: string,
  comic_path: string,
  total_chapters: number,
  status: "em andamento" | "completada" | "pausada";
  recommended_by?: string;
  original_owner?: string;
  rating?: number;
}

export interface Comic {
  id: number;
  name: string;
  sanitized_name: string;
  serie_path: string;
  cover_image: string;
  total_chapters: number;
  created_at: string;
  chapters_read: number;
  reading_data: {
    last_chapter_id: number;
    last_page: number;
    last_read_at: string;
  };
  chapters: ComicChapter[];
  metadata: {
    status: "em andamento" | "completada" | "pausada";
    is_favorite: boolean;
    recommended_by?: string;
    original_owner?: string;
    last_download: number;
    rating?: number;
  };
  comments: string[];
}


export interface ComicChapter {
  id: number;
  name: string;
  sanitized_name: string;
  chapter_path: string;
  create_date: string;
  is_read: boolean;
  is_dowload: boolean;
}
