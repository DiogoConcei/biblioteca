import { Comic } from './comic.interfaces'

export interface OnlySerieProp {
    serie: Comic;
}

export interface visualizerProps {
    book_name: string,
    book_id: number,
    pageNumber: number,
    chapter_id: number
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