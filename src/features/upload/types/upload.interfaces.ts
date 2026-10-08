interface UploadItem {
  path: string;
  type: 'failed' | 'serie' | 'chapter' | 'tie-in';
  status: 'pending' | 'processing' | 'done' | 'error';
}

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

export interface ExistingChapterItem {
  key: string;
  kind: 'existing';
  label: string;
  order: number;
  chapterId: number;
}

export interface NewChapterItem {
  key: string;
  kind: 'new';
  label: string;
  order: number;
  sourcePath: string;
}

export type ChapterListItem = ExistingChapterItem | NewChapterItem;

export type DisplayChapterItem =
  | (ExistingChapterItem & { formIndex?: never })
  | {
      key: string;
      kind: 'new';
      label: string;
      order: number;
      sourcePath: string;
      formIndex: number;
    };
