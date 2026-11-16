import { Filter, Chapter } from '../types/chapter.interfaces';

export const PAGE_SIZE = 12;
export const NEW_CHAPTER_DAYS = 7;
export const MAX_NEW_BADGES = 10;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const FILTERS: { id: Filter; label: string; test: (c: Chapter) => boolean }[] = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'unread', label: 'Não lidos', test: (c) => !c.isRead },
  { id: 'read', label: 'Lidos', test: (c) => c.isRead },
  { id: 'downloaded', label: 'Baixados', test: (c) => c.isDownloaded === 'downloaded' },
];
