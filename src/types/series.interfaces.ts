import { Comic } from "./comic.interfaces";
import { Book } from "./book.interfaces";
import { Manga } from "./manga.interfaces";

export type Literatures = Manga | Book | Comic;
export type LiteratureForms = "Manga" | "Quadrinho";

export interface SeriesProcessor {
  name: string;
  sanitizedName: string;
  archivesPath: string;
  chaptersPath: string;
  createdAt: string;
  collections: string[];
  deletedAt: string;
}

export interface ExhibitionSerieData {
  id: number;
  name: string;
  coverImage: string;
  chaptersRead: number;
  dataPath: string;
  totalChapters: number;
  literatureForm: "Manga" | "Quadrinho" | "Livro" | "";
}

export interface NormalizedSerieData {
  id: number;
  name: string;
  coverImage: string;
  archivesPath: string; // arquivos brutos
  chaptersPath: string; // arquivos tratados
  totalChapters: number;
  status: "Em andamento" | "Completo" | "Pendente" | "";
  isFavorite: boolean;
  collections: string[];
  recommendedBy?: string;
  originalOwner?: string;
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
  tags: string[];
  privacy: "Publica" | "Privada" | "";
  autoBackup: "Sim" | "Não" | "";
  readingStatus: "Em andamento" | "Completo" | "Pendente" | "";
  sanitizedName: string;
  archivesPath: string;
  chaptersPath: string;
  createdAt: string;
  deletedAt: string;
}

export interface SeriesTypes {
  serie: Comic | Manga | Book;
}

export interface AppConfig {
  config: {
    settings: {
      reading_mode: "single_page" | "double_page" | "vertical_scroll";
      zoom: "fit_width" | "fit_height" | "original_size";
      ligth_mode: boolean;
      full_screen: boolean;
    };
  };
  metadata: {
    global_id: number;
  };
}
