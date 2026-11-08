import { createHash } from 'crypto';
import fse from 'fs-extra';
import path from 'path';

import LibrarySystem from '../abstract/LibrarySystem';
import ImageManager from '../../services/processing/ImageManager';
import {
  CandidateMetadata,
  JikanItem,
  KitsuItem,
  OpenLibraryDoc,
  GoogleBookItem,
  CacheEntry,
  MetadataFetchInput,
  ScrapedMetadata,
} from '../../types/metadata.interfaces';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

const MAX_RESULTS = 3;
const MIN_DESCRIPTION_LENGTH = 50;

// Mude essa versão sempre que o formato guardado no cache mudar.
// Chaves antigas deixam de bater e expiram sozinhas.
const CACHE_VERSION = 'v2';

const COVER_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export default class MetadataManager extends LibrarySystem {
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly cachePath: string;
  private readonly coversPath: string;

  constructor() {
    super();
    this.cachePath = path.join(this.appConfigFolder, 'metadataScraperCache.json');
    this.coversPath = path.join(this.appConfigFolder, 'metadataCovers');
  }

  /** Mantido por compatibilidade: devolve só o melhor resultado. */
  public async fetchMetadata(input: MetadataFetchInput): Promise<ScrapedMetadata | null> {
    const results = await this.fetchTopMetadata(input, 1);
    return results[0] ?? null;
  }

  /** Devolve até `limit` resultados, do melhor para o pior, prontos para exibir. */
  public async fetchTopMetadata(
    input: MetadataFetchInput,
    limit: number = MAX_RESULTS,
  ): Promise<ScrapedMetadata[]> {
    console.log('[fetchTopMetadata] 🚀 Iniciando busca com input:', input);

    const query = this.normalizeInput(input);

    if (!query.title) {
      console.warn('[fetchTopMetadata] ⚠️ Título inválido ou em branco. Abortando.');
      return [];
    }

    const cacheKey = this.mountCacheKey(query);
    const cached = await this.getFromCache(cacheKey);

    if (cached) {
      console.log(`[fetchTopMetadata] ✅ HIT no cache ("${cacheKey}")`);
      return this.toDisplay(cached.slice(0, limit));
    }

    console.log('[fetchTopMetadata] ❌ MISS no cache. Consultando provedores...');

    const candidates = await this.collectCandidates(query);
    console.log(`[fetchTopMetadata] 📊 Candidatos brutos: ${candidates.length}`);

    // 1) junta o mesmo título vindo de provedores diferentes (completa autores/gêneros)
    // 2) descarta quem não tem sinopse utilizável
    // 3) ordena por score e fica com os melhores
    const top = this.mergeDuplicates(candidates)
      .filter((item) => (item.description || '').length > MIN_DESCRIPTION_LENGTH)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(
      '[fetchTopMetadata] 🏆 Selecionados:',
      top.map((c) => ({ fonte: c.source, titulo: c.title, score: c.score })),
    );

    if (top.length === 0) {
      console.warn('[fetchTopMetadata] ❌ Nenhum candidato válido. Não vou cachear.');
      return [];
    }

    const normalized = top.map((item) => this.toScrapedMetadata(item));

    // O cache guarda a versão "crua" (capa remota). A capa local é resolvida na saída.
    await this.saveToCache(cacheKey, normalized);

    return this.toDisplay(normalized);
  }

  private toScrapedMetadata(best: CandidateMetadata): ScrapedMetadata {
    return {
      title: best.title,
      altTitles: this.cleanStringArray(best.altTitles),
      description: this.sanitizeDescription(best.description ?? ''),
      authors: this.cleanStringArray(best.authors),
      artists: this.cleanStringArray(best.artists),
      genres: this.cleanStringArray(best.genres),
      publishedAt: best.publishedAt,
      status: best.status || 'unknown',
      coverUrl: best.coverUrl,
      source: best.source,
      scrapedAt: new Date().toISOString(),
    };
  }

  private normalizeInput(input: MetadataFetchInput): MetadataFetchInput {
    return {
      ...input,
      title: (input.title || '').trim(),
      author: input.author?.trim(),
    };
  }

  // ---------------------------------------------------------------------------
  // Candidatos
  // ---------------------------------------------------------------------------

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

  /**
   * Agrupa candidatos com o mesmo título normalizado. O de maior score vence,
   * e os campos que ele não tem são preenchidos pelo outro.
   * Resolve o caso do Kitsu (sem autores/gêneros) vencendo o Jikan.
   */
  private mergeDuplicates(candidates: CandidateMetadata[]): CandidateMetadata[] {
    const groups = new Map<string, CandidateMetadata>();

    for (const candidate of candidates) {
      const key = this.normalizeText(candidate.title);
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, candidate);
        continue;
      }

      const [winner, loser] =
        candidate.score > existing.score ? [candidate, existing] : [existing, candidate];

      groups.set(key, {
        ...winner,
        altTitles: [...(winner.altTitles || []), ...(loser.altTitles || [])],
        description:
          (winner.description || '').length >= (loser.description || '').length
            ? winner.description
            : loser.description,
        authors: winner.authors?.length ? winner.authors : loser.authors,
        artists: winner.artists?.length ? winner.artists : loser.artists,
        genres: winner.genres?.length ? winner.genres : loser.genres,
        publishedAt: winner.publishedAt || loser.publishedAt,
        coverUrl: winner.coverUrl || loser.coverUrl,
        status:
          winner.status && winner.status !== 'unknown' ? winner.status : loser.status,
      });
    }

    return [...groups.values()];
  }

  private async fetchFromJikan(input: MetadataFetchInput): Promise<CandidateMetadata[]> {
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
      const publishedAt = item.published?.from || undefined;

      return {
        title,
        altTitles: [item.title_english, ...(item.title_synonyms || [])].filter(
          (value): value is string => typeof value === 'string',
        ),
        description,
        authors,
        artists: [],
        genres,
        publishedAt,
        status: this.normalizeStatus(item.status),
        coverUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        source: 'jikan',
        score: this.computeScore(input, title, authors, publishedAt),
      };
    });
  }

  private async fetchFromKitsu(input: MetadataFetchInput): Promise<CandidateMetadata[]> {
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
      const publishedAt = attrs.startDate || undefined;

      return {
        title,
        altTitles: Object.values(attrs.titles || {}).filter(
          (value): value is string => typeof value === 'string',
        ),
        description,
        authors: [],
        artists: [],
        genres: [],
        publishedAt,
        status: this.normalizeStatus(attrs.status),
        coverUrl: attrs.posterImage?.large || attrs.posterImage?.original,
        source: 'kitsu',
        score: this.computeScore(input, title, [], publishedAt),
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
      const publishedAt = doc.first_publish_year
        ? String(doc.first_publish_year)
        : undefined;

      return {
        title,
        altTitles: [],
        description: this.sanitizeDescription(
          `Publicação encontrada no OpenLibrary. ${title} ${subjects.length ? `- Temas: ${subjects.join(', ')}.` : ''}`,
        ),
        authors,
        artists: [],
        genres: subjects,
        publishedAt,
        status: 'unknown',
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : undefined,
        source: 'openlibrary',
        score: this.computeScore(input, title, authors, publishedAt),
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
        coverUrl: volume.imageLinks?.thumbnail || volume.imageLinks?.smallThumbnail,
        source: 'google-books',
        score: this.computeScore(input, title, authors, volume.publishedDate),
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Rede
  // ---------------------------------------------------------------------------

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

  private async requestWithTimeout<T>(url: string, timeoutMs: number): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/vnd.api+json, application/json',
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

  // ---------------------------------------------------------------------------
  // Capas locais (exibição no front via getMediaUrl)
  // --------------------------------------------------------------------------

  /** Caminho local determinístico para uma capa remota (mesma URL = mesmo arquivo). */
  private coverFilePath(url: string): string {
    const hash = createHash('sha1').update(url).digest('hex');
    let ext = '.jpg';

    try {
      const candidate = path.extname(new URL(url).pathname).toLowerCase();
      if (COVER_EXTENSIONS.includes(candidate)) ext = candidate;
    } catch {
      // URL inválida: segue com .jpg
    }

    return path.join(this.coversPath, `${hash}${ext}`);
  }

  /** Baixa a capa se ainda não existir em disco. Retorna o caminho local ou undefined. */
  private async ensureCover(url?: string): Promise<string | undefined> {
    if (!url) return undefined;

    const filePath = this.coverFilePath(url);
    if (await fse.pathExists(filePath)) return filePath;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'biblioteca-metadata-scraper/1.0' },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      await fse.ensureDir(this.coversPath);
      await fse.writeFile(filePath, buffer);

      return filePath;
    } catch (error) {
      console.error('Falha ao baixar capa:', url, error);
      return undefined;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Prepara os resultados para o front: baixa as capas (em paralelo) e troca
   * `coverUrl` pela URL servida por getMediaUrl. `coverPath` fica disponível
   * para quando o usuário aplicar a capa ao formulário.
   * Se o download falhar, mantém a URL remota como fallback.
   */
  private async toDisplay(items: ScrapedMetadata[]): Promise<ScrapedMetadata[]> {
    return Promise.all(
      items.map(async (item) => {
        const coverPath = await this.ensureCover(item.coverUrl);

        return {
          ...item,
          coverPath,
          coverUrl: coverPath ? this.imageManager.getMediaUrl(coverPath) : item.coverUrl,
        };
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Cache
  // ---------------------------------------------------------------------------

  private async getFromCache(key: string): Promise<ScrapedMetadata[] | null> {
    const cache = await this.readCache();
    const item = cache.find((entry) => entry.key === key);

    if (!item) return null;

    if (new Date(item.expiresAt).getTime() < Date.now()) {
      await this.deleteCacheKey(key);
      return null;
    }

    return Array.isArray(item.value) ? item.value : null;
  }

  private async saveToCache(key: string, value: ScrapedMetadata[]): Promise<void> {
    const cache = await this.readCache();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

    const updated = cache
      // aproveita para limpar entradas expiradas
      .filter((entry) => entry.key !== key && new Date(entry.expiresAt) > now)
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
      CACHE_VERSION,
      input.type,
      this.normalizeText(input.title),
      input.year || '',
      this.normalizeText(input.author || ''),
    ].join('::');
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

  // ---------------------------------------------------------------------------
  // Texto, score e utilitários
  // ---------------------------------------------------------------------------

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
    candidatePublishedAt?: string,
  ): number {
    let score = this.titleSimilarity(input.title, candidateTitle) * 100;

    if (input.year && candidatePublishedAt) {
      // antes comparava o ano com o TÍTULO do candidato; o certo é a data de publicação
      const candidateYear = this.extractYear(candidatePublishedAt);
      if (candidateYear === input.year) score += 10;
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

  private cleanStringArray(items?: string[]): string[] | undefined {
    if (!items || !items.length) return undefined;

    const normalized = [...new Set(items.map((item) => item.trim()).filter(Boolean))];
    return normalized.length ? normalized : undefined;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
