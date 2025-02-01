import { Comic } from './comic.interfaces'
import { SerieForm } from './series.interfaces';
import { SeriesProcessor } from './series.interfaces';

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

export interface FormInputsProps {
    serie: SeriesProcessor;
    index: number;
    newSeries: SeriesProcessor[];
    setNewSeries: React.Dispatch<React.SetStateAction<SeriesProcessor[]>>;
    handleDataChange: (key: string, value: string) => void;
}

export interface OnlyDataChangeProp {
    handleDataChange: (key: string, value: string) => void;
}

export interface FormCollectionProps {
    formData: SerieForm;
    setFormData: React.Dispatch<React.SetStateAction<SerieForm>>;
    handleDataChange: (key: string, value: string) => void;
}

export interface FormTagProps {
    setFormData: React.Dispatch<React.SetStateAction<SerieForm>>;
    handleDataChange: (key: string, value: string) => void;
}
