import {
  FieldError,
  Control,
  FieldValues,
  Path,
  UseFormRegisterReturn,
} from 'react-hook-form';

import { Manga } from '../../electron/types/manga.interfaces';
import {
  Literatures,
  LiteraturesAttributes,
  LiteratureChapterAttributes,
  Status,
  viewData,
} from '../../electron/types/electron-auxiliar.interfaces';
import { Collection, CreateCollectionDTO } from './collections.interfaces';
import { SerieEditForm, SerieForm, SerieData } from './series.interfaces';

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
  serieData?: {
    id: number;
    name: string;
    coverImage: string;
    dataPath: string;
    totalChapters: number;
  };
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

export interface FormControllerProps {
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

export type FocusedCollectionViewProps = {
  collection: Collection | null;
  activeIndex: number;
  onChangeIndex?: (index: number) => void;
  onOpenReader: (
    e: React.MouseEvent<HTMLButtonElement | SVGElement>,
    serieId: number,
  ) => void;
  onRemoveFromCollection: (
    collectionName: string,
    serieId: number,
  ) => Promise<boolean>;
  onReorderSeries?: (
    collectionName: string,
    orderedSeriesIds: number[],
  ) => Promise<boolean>;
  onUpdateSerieBackground?: (
    collectionName: string,
    serieId: number,
    path: string | null,
    previewImage?: string | null,
  ) => Promise<boolean>;
};

export interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (collection: CreateCollectionDTO) => Promise<void>;
  series: viewData[] | null;
}

export interface SelectedSerieData {
  id: number;
  rating: number;
  status: Status;
}

export interface CreateCollectionFormValues {
  name: string;
  description: string;
  coverType: 'external' | 'series';
  coverImage: string; // usado apenas para preview / upload
  seriesCoverId: string; // id selecionado quando coverType === 'series'
  selectedSeries: SelectedSerieData[];
}

export type SelectOptionValue = string | number;

export type SelectOption = {
  value: SelectOptionValue;
  label: string;
};

export type SelectProps = {
  options: SelectOption[];
  value?: SelectOptionValue;
  onChange: (value: SelectOptionValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  optionClassName?: string;
  dropdownClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  label?: string;
  renderOption?: (option: SelectOption, selected: boolean) => JSX.Element;
};

export default interface CustomTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  minuteStep?: number;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  label?: string;
}
