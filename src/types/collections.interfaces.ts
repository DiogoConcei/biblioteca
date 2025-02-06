import { status } from "./manga.interfaces";

export interface UserCollections {
    collections: Collection[];
}

export interface Collection {
    name: string;
    description: string;
    series: SerieCollectionInfo[];
    comments: string[];
    updatedAt: string;
}

export interface SerieCollectionInfo {
    id: number;
    name: string,
    cover_image: string,
    comic_path: string,
    archives_path: string,
    total_chapters: number,
    status: status,
    recommended_by: string,
    original_owner: string,
    rating: number
}
