import { Comic } from "./comic.interfaces"
import { Book } from "./book.interfaces";
import { Manga } from "./manga.interfaces";

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

export interface SerieForm {
    name: string;
    genre?: string;
    author?: string;
    language?: string;
    literatureForm: "Manga" | "Quadrinho" | "Livro" | "";
    collection: string[];
    privacy: "Publica" | "Privada" | "";
    autoBackup: "Sim" | "Não" | "";
    readingStatus: "Em andamento" | "Completo" | "Pendente" | "";
    tags: string[];
}

export interface SeriesTypes {
    serie: Comic | Manga | Book
}
