export interface HistoryFile {
  summaries: SerieHistoryEntry[];
  events: ReadEvent[];
}

export interface SerieHistoryEntry {
  serieId: number;
  serieName: string; // snapshot
  coverImage: string; // snapshot
  lastChapterId: number;
  lastReadAt: string;
  chaptersRead: number; // sempre recalculado por contagem, nunca incrementado/decrementado manualmente
  totalChapters: number; // snapshot, sincronizado pelo gatilho de capítulo adicionado/removido
}

export interface ReadEvent {
  serieId: number;
  chapterId: number;
  readAt: string;
}
