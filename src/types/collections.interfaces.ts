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
