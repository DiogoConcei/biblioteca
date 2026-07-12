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

export interface CandidateMetadata {
  title: string;
  altTitles?: string[];
  description?: string;
  authors?: string[];
  artists?: string[];
  genres?: string[];
  publishedAt?: string;
  status?: 'ongoing' | 'completed' | 'unknown';
  coverUrl?: string;
  source: string;
  score: number;
}

export interface CacheEntry {
  key: string;
  value: ScrapedMetadata;
  createdAt: string;
  expiresAt: string;
}

export interface JikanItem {
  title?: string;
  synopsis?: string;
  authors?: Array<{ name?: string }>;
  genres?: Array<{ name?: string }>;
  title_english?: string;
  title_synonyms?: string[];
  published?: { from?: string };
  status?: string;
  images?: { jpg?: { large_image_url?: string; image_url?: string } };
}

export interface KitsuItem {
  attributes?: {
    canonicalTitle?: string;
    titles?: Record<string, string>;
    synopsis?: string;
    description?: string;
    startDate?: string;
    status?: string;
    posterImage?: { large?: string; original?: string };
  };
}

export interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  subject?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

export interface GoogleBookItem {
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    description?: string;
    authors?: string[];
    categories?: string[];
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}
