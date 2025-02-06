import { Comic } from "./comic.interfaces"
import { Book } from "./book.interfaces";
import { Manga } from "./manga.interfaces";

export type Literatures = Manga | Book | Comic;

export interface SeriesProcessor {
    id: number,
    name: string;
    sanitized_name: string;
    archives_path: string;
    chapters_path: string;
    created_at: string;
    collections: string[];
    deleted_at: string
}

export interface ExhibitionSerieData {
    id: number,
    name: string,
    cover_image: string,
    chapters_read: number,
    dataPath: string,
    total_chapters: number,
    literatureForm: "Manga" | "Quadrinho" | "Livro" | ""
}

export interface NormalizedSerieData {
    id: number,
    name: string,
    cover_image: string,
    archive_path: string, // arquivos brutos
    chapters_path: string, // arquivos tratados
    total_chapters: number,
    status: "Em andamento" | "Completo" | "Pendente" | "";
    is_favorite: boolean,
    collections: string[];
    recommended_by?: string;
    original_owner?: string;
    rating?: number;
}

export interface SerieForm {
    name: string;
    genre?: string;
    author?: string;
    language?: string;
    cover_path: string;
    literatureForm: "Manga" | "Quadrinho" | "Livro" | "";
    collections: string[];
    privacy: "Publica" | "Privada" | "";
    autoBackup: "Sim" | "Não" | "";
    readingStatus: "Em andamento" | "Completo" | "Pendente" | "";
    sanitized_name: string;
    archives_path: string;
    chapters_path: string;
    created_at: string;
    deleted_at: string
}

export interface SeriesTypes {
    serie: Comic | Manga | Book
}

export interface AppConfig {
    config: {
        settings: {
            reading_mode: "single_page" | "double_page" | "vertical_scroll";
            zoom: "fit_width" | "fit_height" | "original_size";
            ligth_mode: boolean,
            full_screen: boolean
        };
    },
    metadata: {
        global_id: number
    }
}
