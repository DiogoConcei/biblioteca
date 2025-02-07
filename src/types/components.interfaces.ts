import { Comic } from './comic.interfaces'
import { Manga } from './manga.interfaces';
import { SerieForm } from './series.interfaces';
import { SeriesProcessor } from './series.interfaces';

export interface OnlySerieProp {
    manga: Manga;
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
    nextChapter: () => void,
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
    manga: Manga;
    setManga: React.Dispatch<React.SetStateAction<Manga | null>>
}

export interface downloadButtonProps {
    dataPath: string
}

export interface GlobalContext {
    isHidden: boolean,
    setIsHidden: (value: boolean) => void;
    theme: boolean;
    setTheme: (value: boolean) => void;
}

export interface FormInputsProps {
    index: number;
    newSeries: SeriesProcessor[];
    setNewSeries: React.Dispatch<React.SetStateAction<SeriesProcessor[]>>;
    handleDataChange: (key: string, value: string) => void;
}

export interface OnlyDataChangeProp {
    handleDataChange: (key: string, value: string) => void;
}

export interface CostumizeImageProps {
    handleDataChange: (key: string, value: string) => void;
    setImageSrc: React.Dispatch<React.SetStateAction<string>>;
    imageSrc: string;
}

export interface FormCollectionProps {
    formData: SerieForm;
    setFormData: React.Dispatch<React.SetStateAction<SerieForm>>;
}

export interface FormTagProps {
    setFormData: React.Dispatch<React.SetStateAction<SerieForm>>;
    handleDataChange: (key: string, value: string) => void;
}

export interface CollectionButtonProps {
    dataPath: string
}