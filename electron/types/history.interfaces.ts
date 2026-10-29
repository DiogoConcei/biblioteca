import { LiteratureForm } from '@/shared/types/series.interfaces';

export interface HistoryFile {
  summaries: SerieHistoryEntry[];
  events: ReadEvent[];
}

export interface SerieHistoryEntry {
  serieId: number;
  serieName: string;
  coverImage: string;
  literatureForm: LiteratureForm;
  lastChapterId: number;
  lastChapterLabel: string;
  lastReadAt: string;
  chaptersRead: number;
  totalChapters: number;
}

export interface ReadEvent {
  serieId: number;
  chapterName: string;
  lastPageRead: number;
  literatureForm: LiteratureForm;
  isRead: boolean;
  chapterId: number;
  readAt: string;
}
