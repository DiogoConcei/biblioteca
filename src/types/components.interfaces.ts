import { Manga } from '../../electron/types/manga.interfaces';
import {
  FieldError,
  Control,
  FieldValues,
  Path,
  UseFormRegisterReturn,
} from 'react-hook-form';
import {
  Literatures,
  LiteraturesAttributes,
  LiteratureChapterAttributes,
} from '../../electron/types/electron-auxiliar.interfaces';
import { SerieEditForm } from './series.interfaces';
import { SerieForm, SerieData } from './series.interfaces';

export interface OnlySerieProp {
  manga: Literatures;
}

export type DownloadStatus = 'not_downloaded' | 'downloading' | 'downloaded';

export interface ChaptersInfoProp {
  manga: Manga;
  updateSerie: (path: string, newValue: LiteraturesAttributes) => void;
  updateChapter: (
    index: number,
    path: string,
    newValue: LiteratureChapterAttributes,
  ) => void;
}

export interface ChapterView {
  id: number;
  serieName: string;
  chapterName: string;
  isLoading: boolean;
  isDownloaded: DownloadStatus;
  pages: string[];
  quantityPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
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

export interface FormTextInputProps {
  msg: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
}

export interface FormInputProps {
  register: UseFormRegisterReturn;
  error?: FieldError;
}

export interface FormControllerProps<T extends FieldValues = FieldValues> {
  control: Control<SerieEditForm>;
  label?: string;
}

export interface GenericControllerProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  name: Path<T>;
}

export interface FavoriteProps {
  serie: Literatures;
}

export interface RatingProps {
  serie: Literatures;
}
