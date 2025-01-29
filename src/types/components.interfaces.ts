import { Comic } from './comic.interfaces'

export interface OnlySerieProp {
    serie: Comic;
}

export interface PageControlProps {
    currentPage: number,
    TamPages: number;
    prevPage: () => void;
    nextPage: () => void
}

export interface visualizerProps {
    currentPage: number,
    prevChapter: () => void,
    setScale: React.Dispatch<React.SetStateAction<number>>,
    nextChapter: () => void;
}

export interface dinamicNavProp {
    isHidden: boolean;
}

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export interface SearchBarProps {
    searchInput: string;
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ComicCardsProps {
    searchInput: string;
}

export interface ComicActionsProps {
    serie: Comic;
    setSerie: React.Dispatch<React.SetStateAction<Comic | null>>
}

export interface downloadButtonProps {
    serieName: string
}

export interface GlobalContext {
    isHidden: boolean,
    setIsHidden: (value: boolean) => void;
    theme: boolean;
    setTheme: (value: boolean) => void;
}