import { Manga } from '../../electron/types/manga.interfaces';
import {
  Literatures,
  LiteraturesAttributes,
  LiteratureChapterAttributes,
  ChapterView,
} from '../../electron/types/electron-auxiliar.interfaces';
import { SerieForm, SerieData } from './series.interfaces';

export interface OnlySerieProp {
  manga: Literatures;
}

export interface ChaptersInfoProp {
  manga: Manga;
  updateSerie: (path: string, newValue: LiteraturesAttributes) => void;
  updateChapter: (
    index: number,
    path: string,
    newValue: LiteratureChapterAttributes,
  ) => void;
}

export interface PageControlProps {
  currentPage: number;
  TamPages: number;
  prevPage: () => void;
  nextPage: () => void;
}

export interface visualizerProps {
  currentPage: number;
  prevChapter: () => void;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  nextChapter: () => void;
  totalPages: number;
}

export interface dinamicNavProp {
  isHidden: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  paginationNumbers: number[];
}

export interface SearchBarProps {
  searchInput: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ComicCardsProps {
  searchInput: string;
}

export interface downloadButtonProps {
  serie: Literatures;
}

export interface GlobalContext {
  isHidden: boolean;
  setIsHidden: (value: boolean) => void;
  theme: boolean;
  setTheme: (value: boolean) => void;
}

export interface FormInputsProps {
  index: number;
  newSeries: SerieData[];
  setNewSeries: React.Dispatch<React.SetStateAction<SerieData[]>>;
  handleDataChange: (key: string, value: string) => void;
}

export interface OnlyDataChangeProp {
  handleDataChange: (key: string, value: string) => void;
}

export interface CostumizeImageProps {
  setImageSrc: (src: string) => void;
  imageSrc: string;
  formSteps: number;
}

export interface IntegrateFormProps {
  setImageSrc: React.Dispatch<React.SetStateAction<string>>;
  archivesPath: string;
  literatureForm: string;
  setFormData: React.Dispatch<React.SetStateAction<SerieForm>>;
}

export interface FormCollectionProps {
  formData: SerieForm;
  setFormData: React.Dispatch<React.SetStateAction<SerieForm>>;
}

export interface FormTagProps {
  setFormData: React.Dispatch<React.SetStateAction<SerieForm>>;
}

export interface CollectionButtonProps {
  dataPath: string;
}

export interface SerieActionProps {
  manga: Literatures;
  updateSerie: (path: string, newValue: LiteraturesAttributes) => Promise<void>;
  updateFavCollection: (serie: Literatures, isFav: boolean) => Promise<boolean>;
}

export interface ErrorScreenProps {
  serieName?: string;
  error: string;
}
