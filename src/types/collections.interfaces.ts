import { Status } from '../../electron/types/manga.interfaces';

export interface CreateCollectionDTO
  extends Omit<Collection, 'createdAt' | 'updatedAt'> {
  seriesCoverId?: number | null;
}

export interface Collection {
  name: string;
  description: string;
  coverImage: string;
  series: SerieInCollection[];
  comments: string[];
  updatedAt: string;
  createdAt: string;
}

export interface SerieInCollection {
  id: number;
  name: string;
  description: string;
  coverImage: string;
  archivesPath: string;
  totalChapters: number;
  status: Status;
  recommendedBy: string;
  originalOwner: string;
  rating: number;
  addAt: string;
}
