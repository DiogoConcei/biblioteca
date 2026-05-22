export type MetadataType = 'manga' | 'comic';

export interface MetadataFetchInput {
  title: string;
  type: MetadataType;
  year?: number;
  author?: string;
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
