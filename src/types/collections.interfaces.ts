import { Status } from '../../electron/types/manga.interfaces';

export interface CreateCollectionDTO
  extends Omit<Collection, 'createdAt' | 'updatedAt'> {
  seriesCoverId?: number | null;
}

export interface ScrapedMetadata {
  title: string;
  altTitles?: string[];
  description: string;
  authors?: string[];
  artists?: string[];
  genres?: string[];
  publishedAt?: string;
  status?: 'ongoing' | 'completed' | 'unknown';
  coverUrl?: string;
  source: string;
  scrapedAt: string;
}

export interface Collection {
  id?: string;
  name: string;
  description: string;
  coverImage: string;
  series: SerieInCollection[];
  includeInAutoBackup?: boolean;
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
  backgroundImage?: string | null;
  recommendedBy: string;
  originalOwner: string;
  rating: number;
  addAt: string;
  position: number;
}

export interface MetadataPayload {
  description: string;
  source: 'xml' | 'scrapper';
}
