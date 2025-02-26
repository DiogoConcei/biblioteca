import { Comic } from './comic.interfaces'
import { Manga, MangaChapter } from './manga.interfaces';
import { SerieForm } from './series.interfaces';
import { SeriesProcessor } from './series.interfaces';
import { Collection } from "./collections.interfaces"

export interface OnlySerieProp {
    manga: Manga;
}

export interface ChaptersInfoProp {
    manga: Manga;
    setManga: React.Dispatch<React.SetStateAction<Manga | null>>
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
    setfavCollection: React.Dispatch<React.SetStateAction<Collection | null>>,
    setManga: React.Dispatch<React.SetStateAction<Manga | null>>
}

export interface downloadButtonProps {
    manga: Manga;
    setManga: React.Dispatch<React.SetStateAction<Manga | null>>
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
    handleDataChange: (field: string, value: any) => void;
    setImageSrc: (src: string) => void;
    imageSrc: string;
    formSteps: number;
}

export interface IntegrateFormProps {
    setImageSrc: React.Dispatch<React.SetStateAction<string>>,
    archivesPath: string,
    literatureForm: string,
    setFormData: React.Dispatch<React.SetStateAction<SerieForm>>
}

export interface FormCollectionProps {
    formData: SerieForm;
    setFormData: React.Dispatch<React.SetStateAction<SerieForm>>;
}

export interface FormTagProps {
    setFormData: React.Dispatch<React.SetStateAction<SerieForm>>;
}

export interface CollectionButtonProps {
    dataPath: string
}