
export interface Manga {
    id: number;
    name: string;
    sanitized_name: string;
    genre?: string;
    author?: string;
    language?: string;
    cover_image: string;
    archives_path: string;
    chapters_path: string;
    data_path: string;
    chapters: MangaChapter[];
    total_chapters: number;
    chapters_read: number;
    literatureForm: "Manga" | "Quadrinho" | "Livro" | "";
    reading_data: {
        last_chapter_id: number;
        last_read_at: string;
    };
    metadata: {
        status: "Em andamento" | "Completo" | "Pendente" | "";
        collections: string[];
        recommended_by?: string;
        original_owner?: string;
        last_download: number;
        privacy: "Publica" | "Privada" | "";
        rating?: number;
        is_favorite: boolean;
        autoBackup: "Sim" | "Não" | "";
    };
    comments: string[];
    deleted_at: string;
    created_at: string;
}

export interface MangaChapter {
    id: number;
    name: string;
    sanitized_name: string;
    archive_path: string;
    chapter_path: string;
    created_at: string;
    is_read: boolean;
    is_dowload: boolean;
    page: {
        last_page_read: number;
        favorite_page: number
    }
}


export interface MangaConfig {
    config: {
        settings: {
            reading_mode: "single_page" | "double_page" | "vertical_scroll";
            zoom: "fit_width" | "fit_height" | "original_size";
            ligth_mode: boolean,
            full_screen: boolean
        };
    };
}

