import { Filter, Chapter } from '../types/chapter.interfaces';
import { DAY_MS, NEW_CHAPTER_DAYS } from '../constants/chapterConstants';

export const daysSince = (chapter: Chapter) =>
  Math.floor((Date.now() - new Date(chapter.createdAt).getTime()) / DAY_MS);

export const isRecent = (chapter: Chapter) => daysSince(chapter) < NEW_CHAPTER_DAYS;

export const addedLabel = (days: number) => {
  if (days <= 0) return 'Adicionado hoje';
  if (days === 1) return 'Adicionado há 1 dia';
  return `Adicionado há ${days} dias`;
};

export const subtitleOf = (chapter: Chapter, isNew: boolean): string => {
  if (chapter.isDownloaded === 'downloading') return 'Baixando…';
  if (chapter.isRead) return 'Lido';
  const lastPage = chapter.page?.lastPageRead ?? 0;
  if (lastPage > 0) return `Parou na pág. ${lastPage}`;
  if (isNew) return addedLabel(daysSince(chapter));
  if (chapter.isDownloaded === 'downloaded') return 'Baixado';
  return '';
};

export const formatChapterNumber = (chapter: Chapter): string => {
  const raw = chapter.chapterNumber?.label ?? String(chapter.order);
  return /^\d+$/.test(raw) ? raw.padStart(2, '0') : raw;
};
