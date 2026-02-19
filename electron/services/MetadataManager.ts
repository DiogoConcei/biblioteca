import fse from 'fs-extra';
import path from 'path';

import LibrarySystem from './abstract/LibrarySystem';

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

interface CandidateMetadata {
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

interface CacheEntry {
  key: string;
  value: ScrapedMetadata;
  createdAt: string;
  expiresAt: string;
}

interface JikanItem {
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

interface KitsuItem {
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

interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  subject?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

interface GoogleBookItem {
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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

export default class MetadataScraperService extends LibrarySystem {
  private readonly cachePath: string;

  constructor() {
    super();
    this.cachePath = path.join(
      this.appConfigFolder,
      'metadataScraperCache.json',
    );
  }

  public async fetchMetadata(
    input: MetadataFetchInput,
  ): Promise<ScrapedMetadata | null> {
    const query = this.normalizeInput(input);

    if (!query.title) return null;

    const cacheKey = this.mountCacheKey(query);
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    const candidates = await this.collectCandidates(query);
    const best = candidates
      .filter((item) => (item.description || '').length > 50)
      .sort((a, b) => b.score - a.score)[0];

    if (!best || !best.description) return null;

    const normalized: ScrapedMetadata = {
      title: best.title,
      altTitles: this.cleanStringArray(best.altTitles),
      description: this.sanitizeDescription(best.description),
      authors: this.cleanStringArray(best.authors),
      artists: this.cleanStringArray(best.artists),
      genres: this.cleanStringArray(best.genres),
      publishedAt: best.publishedAt,
      status: best.status || 'unknown',
      coverUrl: best.coverUrl,
      source: best.source,
      scrapedAt: new Date().toISOString(),
    };

    await this.saveToCache(cacheKey, normalized);
    return normalized;
  }

  private normalizeInput(input: MetadataFetchInput): MetadataFetchInput {
    return {
      ...input,
      title: (input.title || '').trim(),
      author: input.author?.trim(),
    };
  }

  private async collectCandidates(
    input: MetadataFetchInput,
  ): Promise<CandidateMetadata[]> {
    const providers =
      input.type === 'manga'
        ? [() => this.fetchFromJikan(input), () => this.fetchFromKitsu(input)]
        : [
            () => this.fetchFromOpenLibrary(input),
            () => this.fetchFromGoogleBooks(input),
          ];

    const settled = await Promise.allSettled(providers.map((fn) => fn()));
    const candidates: CandidateMetadata[] = [];

    for (const result of settled) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      candidates.push(...result.value);
    }

    return candidates;
  }

  private async fetchFromJikan(
    input: MetadataFetchInput,
  ): Promise<CandidateMetadata[]> {
    const data = await this.safeRequest<{ data?: JikanItem[] }>(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(input.title)}&limit=8`,
    );

    if (!data?.data) return [];

    return data.data.map((item) => {
      const title = item.title || input.title;
      const description = this.sanitizeDescription(item.synopsis || '');
      const authors = Array.isArray(item.authors)
        ? item.authors.map((author: { name?: string }) => author.name || '')
        : [];
      const genres = Array.isArray(item.genres)
        ? item.genres.map((genre: { name?: string }) => genre.name || '')
        : [];

      return {
        title,
        altTitles: [item.title_english, ...(item.title_synonyms || [])].filter(
          (value): value is string => typeof value === 'string',
        ),
        description,
        authors,
        artists: [],
        genres,
        publishedAt: item.published?.from || undefined,
        status: this.normalizeStatus(item.status),
        coverUrl:
          item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        source: 'jikan',
        score: this.computeScore(input, title, authors),
      };
    });
  }

  private async fetchFromKitsu(
    input: MetadataFetchInput,
  ): Promise<CandidateMetadata[]> {
    const data = await this.safeRequest<{ data?: KitsuItem[] }>(
      `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(input.title)}&page[limit]=8`,
    );

    if (!data?.data) return [];

    return data.data.map((item) => {
      const attrs = item.attributes || {};
      const title = attrs.canonicalTitle || attrs.titles?.en || input.title;
      const description = this.sanitizeDescription(
        attrs.synopsis || attrs.description || '',
      );

      return {
        title,
        altTitles: Object.values(attrs.titles || {}).filter(
          (value): value is string => typeof value === 'string',
        ),
        description,
        authors: [],
        artists: [],
        genres: [],
        publishedAt: attrs.startDate || undefined,
        status: this.normalizeStatus(attrs.status),
        coverUrl: attrs.posterImage?.large || attrs.posterImage?.original,
        source: 'kitsu',
        score: this.computeScore(input, title, []),
      };
    });
  }

  private async fetchFromOpenLibrary(
    input: MetadataFetchInput,
  ): Promise<CandidateMetadata[]> {
    const data = await this.safeRequest<{ docs?: OpenLibraryDoc[] }>(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(input.title)}&limit=10`,
    );

    if (!data?.docs) return [];

    return data.docs.map((doc) => {
      const title = doc.title || input.title;
      const authors = (doc.author_name || []).filter(
        (name: unknown): name is string => typeof name === 'string',
      );
      const subjects = (doc.subject || [])
        .filter((name: unknown): name is string => typeof name === 'string')
        .slice(0, 8);

      return {
        title,
        altTitles: [],
        description: this.sanitizeDescription(
          `Publicação encontrada no OpenLibrary. ${title} ${subjects.length ? `- Temas: ${subjects.join(', ')}.` : ''}`,
        ),
        authors,
        artists: [],
        genres: subjects,
        publishedAt: doc.first_publish_year
          ? String(doc.first_publish_year)
          : undefined,
        status: 'unknown',
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : undefined,
        source: 'openlibrary',
        score: this.computeScore(input, title, authors),
      };
    });
  }

  private async fetchFromGoogleBooks(
    input: MetadataFetchInput,
  ): Promise<CandidateMetadata[]> {
    const query = `intitle:${input.title} subject:comics`;
    const data = await this.safeRequest<{ items?: GoogleBookItem[] }>(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`,
    );

    if (!data?.items) return [];

    return data.items.map((item) => {
      const volume = item.volumeInfo || {};
      const title = volume.title || input.title;
      const description = this.sanitizeDescription(volume.description || '');
      const authors = Array.isArray(volume.authors)
        ? volume.authors.filter(
            (name: unknown): name is string => typeof name === 'string',
          )
        : [];

      return {
        title,
        altTitles: volume.subtitle ? [volume.subtitle] : [],
        description,
        authors,
        artists: [],
        genres: Array.isArray(volume.categories) ? volume.categories : [],
        publishedAt: volume.publishedDate,
        status: 'unknown',
        coverUrl:
          volume.imageLinks?.thumbnail || volume.imageLinks?.smallThumbnail,
        source: 'google-books',
        score: this.computeScore(input, title, authors),
      };
    });
  }

  private async safeRequest<T>(url: string): Promise<T | null> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const data = await this.requestWithTimeout<T>(url, REQUEST_TIMEOUT_MS);
        return data;
      } catch (error) {
        if (attempt === MAX_RETRIES - 1) {
          console.error('Metadata request failed:', error);
          return null;
        }

        const delay = 400 * 2 ** attempt;
        await this.sleep(delay);
      }
    }

    return null;
  }

  private async requestWithTimeout<T>(
    url: string,
    timeoutMs: number,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'biblioteca-metadata-scraper/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private sanitizeDescription(input: string): string {
    const withoutHtml = input
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const cleaned = withoutHtml
      .replace(/\[(?:source|edit|citation needed)\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }

  private normalizeStatus(raw?: string): 'ongoing' | 'completed' | 'unknown' {
    if (!raw) return 'unknown';

    const normalized = raw.toLowerCase();
    if (normalized.includes('publishing') || normalized.includes('ongoing'))
      return 'ongoing';
    if (normalized.includes('finished') || normalized.includes('complete'))
      return 'completed';

    return 'unknown';
  }

  private computeScore(
    input: MetadataFetchInput,
    candidateTitle: string,
    candidateAuthors: string[],
  ): number {
    const titleScore = this.titleSimilarity(input.title, candidateTitle) * 100;
    let score = titleScore;

    if (input.year) {
      const yearInCandidate = this.extractYear(candidateTitle);
      if (yearInCandidate === input.year) score += 10;
    }

    if (input.author) {
      const authorMatch = candidateAuthors.some(
        (author) => this.titleSimilarity(author, input.author || '') > 0.7,
      );
      if (authorMatch) score += 15;
    }

    return score;
  }

  private titleSimilarity(a: string, b: string): number {
    const left = this.normalizeText(a);
    const right = this.normalizeText(b);
    if (!left || !right) return 0;
    if (left === right) return 1;

    const leftBigrams = this.bigrams(left);
    const rightBigrams = this.bigrams(right);

    if (!leftBigrams.length || !rightBigrams.length) return 0;

    let intersection = 0;
    const rightMap = new Map<string, number>();

    rightBigrams.forEach((gram) => {
      rightMap.set(gram, (rightMap.get(gram) || 0) + 1);
    });

    for (const gram of leftBigrams) {
      const count = rightMap.get(gram) || 0;
      if (count > 0) {
        intersection += 1;
        rightMap.set(gram, count - 1);
      }
    }

    return (2 * intersection) / (leftBigrams.length + rightBigrams.length);
  }

  private bigrams(value: string): string[] {
    if (value.length < 2) return [value];
    const grams: string[] = [];

    for (let index = 0; index < value.length - 1; index += 1) {
      grams.push(value.slice(index, index + 2));
    }

    return grams;
  }

  private normalizeText(value: string): string {
    return value
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractYear(value: string): number | null {
    const match = value.match(/(19|20)\d{2}/);
    if (!match) return null;
    return Number(match[0]);
  }

  private async getFromCache(key: string): Promise<ScrapedMetadata | null> {
    const cache = await this.readCache();
    const item = cache.find((entry) => entry.key === key);

    if (!item) return null;

    if (new Date(item.expiresAt).getTime() < Date.now()) {
      await this.deleteCacheKey(key);
      return null;
    }

    return item.value;
  }

  private async saveToCache(
    key: string,
    value: ScrapedMetadata,
  ): Promise<void> {
    const cache = await this.readCache();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

    const updated = cache
      .filter((entry) => entry.key !== key)
      .concat({
        key,
        value,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

    await this.writeCache(updated);
  }

  private async deleteCacheKey(key: string): Promise<void> {
    const cache = await this.readCache();
    const updated = cache.filter((entry) => entry.key !== key);
    await this.writeCache(updated);
  }

  private mountCacheKey(input: MetadataFetchInput): string {
    return [
      input.type,
      this.normalizeText(input.title),
      input.year || '',
      this.normalizeText(input.author || ''),
    ].join('::');
  }

  private cleanStringArray(items?: string[]): string[] | undefined {
    if (!items || !items.length) return undefined;

    const normalized = [
      ...new Set(items.map((item) => item.trim()).filter(Boolean)),
    ];
    return normalized.length ? normalized : undefined;
  }

  private async readCache(): Promise<CacheEntry[]> {
    try {
      await fse.ensureDir(this.appConfigFolder);
      if (!(await fse.pathExists(this.cachePath))) {
        return [];
      }

      const data = (await fse.readJson(this.cachePath)) as CacheEntry[];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Falha ao ler cache de metadata:', error);
      return [];
    }
  }

  private async writeCache(entries: CacheEntry[]): Promise<void> {
    try {
      await fse.ensureDir(this.appConfigFolder);
      await fse.writeJson(this.cachePath, entries, { spaces: 2 });
    } catch (error) {
      console.error('Falha ao salvar cache de metadata:', error);
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
