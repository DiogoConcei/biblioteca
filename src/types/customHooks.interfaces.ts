export interface UseChapterParams {
  serieName: string;
  chapterId: string;
  page: string;
}

export interface useChapterReturn {
  serieName: string;
  chapterId: number;
  currentPage: number;
  pages: string[];
  quantityPages: number;
  isLoading: boolean;
  error: string | null;
  downloadingNext: React.RefObject<boolean>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  triggerDownload: () => Promise<void>;
}

export interface useSimpleNavigationReturn {
  nextChapter: () => void;
  nextPage: () => void;
  prevChapter: () => void;
  prevPage: () => void;
}

export interface useChapterNavigationParams {
  serieName: string;
  chapterId: number;
  pages: string[];
}

type navigationAction =
  | { type: "NEXT_PAGE"; pagesLength: number }
  | { type: "PREV_PAGE" }
  | { type: "SET_PAGE"; page: number };
