import { Status } from "./manga.interfaces";

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
  coverImage: string;
  comic_path: string;
  archivesPath: string;
  totalChapters: number;
  status: Status;
  recommendedBy: string;
  originalOwner: string;
  rating: number;
}
