import { Status } from '../../electron/types/manga.interfaces';

export interface Collection {
  name: string;
  description: string;
  coverImage: string;
  series: SeriesInCollection[];
  comments: string[];
  updatedAt: string;
  createdAt: string;
}

export interface SeriesInCollection {
  id: number;
  name: string;
  coverImage: string;
  archivesPath: string;
  totalChapters: number;
  status: Status;
  recommendedBy: string;
  originalOwner: string;
  rating: number;
  addAt: string;
}
