
export interface Comic {
  id: number;
  name: string;
  sanitized_name: string;
  archives_path: string;
  chapters_path: string;
  cover_image: string;
  total_chapters: number;
  created_at: string;
  chapters_read: number;
  reading_data: {
    last_chapter_id: number;
    last_read_at: string;
  };
  chapters: ComicEdition[];
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

export interface ComicEdition {
  id: number;
  name: string;
  sanitized_name: string;
  archive_path: string;
  chapter_path: string;
  created_at: string;
  is_read: boolean;
  is_dowload: boolean;
  last_page_read: number;
}


export interface ComicConfig {
  config: {
    settings: {
      reading_mode: "single_page" | "double_page" | "vertical_scroll";
      zoom: "fit_width" | "fit_height" | "original_size";
      ligth_mode: boolean,
      full_screen: boolean
    };
  };
  metadata: {
    global_id: number;
  };
}

