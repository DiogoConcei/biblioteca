
export interface Book {
    id: number;
    name: string;
    sanitized_name: string;
    archives_path: string;
    chapters_path: string;
    data_path: string;
    cover_image: string;
    total_chapters: number;
    chapters_read: number;
    genre?: string;
    author?: string;
    language?: string;
    literatureForm: "Manga" | "Quadrinho" | "Livro" | "";
    reading_data: {
        last_chapter_id: number;
        last_read_at: string;
    };
    chapters: BookPage[];
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
    deleted_at: string
    created_at: string;
    comments: string[];
}

export interface BookPage {
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


export interface BookConfig {
    config: {
        settings: {
            reading_mode: "single_page" | "double_page" | "vertical_scroll";
            zoom: "fit_width" | "fit_height" | "original_size";
            ligth_mode: boolean,
            full_screen: boolean
        };
    };
}

