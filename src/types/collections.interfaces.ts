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
    name: string;
    cover_image: string;
    archive_path: string;
    total_chapters: number;
    recommended_by?: string;
    original_owner?: string;
    rating?: number;
}
