import { LiteratureChapter } from "../types/series.interfaces";

export interface UseChapterParams {
  serieName: string;
  chapterId: number;
  page: number;
}

export interface useChapterReturn {
  serieName: string;
  chapterId: number;
  currentPage: number;
  pages: string[];
  quantityPages: number;
  isLoading: boolean;
  error: string | null;
  isNextDownloaded: React.RefObject<boolean>;
  isPrevDownloaded: React.RefObject<boolean>;
  downloaded: boolean;
  markPrevDownloaded: () => void;
  markNextDownloaded: () => void;
  setDownloaded: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
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

export interface useDownloadParams {
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setDownloaded?: React.Dispatch<React.SetStateAction<boolean>>;
  setDownloadStatus?: React.Dispatch<
    React.SetStateAction<
      Record<number, "not_downloaded" | "downloading" | "downloaded">
    >
  >;
}

export interface downloadChapter {
  serieName: string;
  chapterId: number;
  alreadyDownloaded: React.RefObject<boolean>;
}

export interface UsePaginationProps {
  chapters: LiteratureChapter[];
  itemsPerPage?: number;
  initialPage?: number;
  ascending?: boolean;
}
