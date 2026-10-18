export interface SerieData {
  name: string;
  sanitizedName: string;
  newPath: string;
  oldPath: string;
  createdAt: string;
}

export interface ChapterData {
  name: string;
  sanitizedName: string;
  oldPath: string;
  createdAt: string;
}

export interface FailedItem {
  path: string;
  reason: string;
}

export interface ProcessedUploadResult {
  series: SerieData[];
  chapters: ChapterData[];
  failed: FailedItem[];
}

export interface ProcessedChapterResult {
  succeeded: string[];
  failed: FailedItem[];
}

export interface ProcessedChapterResult {
  succeeded: string[];
  failed: FailedItem[];
}

export interface ChapterUploadItem {
  sourcePath: string;
  label: string;
  order: number;
}

export interface ChapterUploadPayload {
  serieId: number;
  chapters: ChapterUploadItem[];
}
