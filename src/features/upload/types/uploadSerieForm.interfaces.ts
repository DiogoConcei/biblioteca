import {
  Control,
  FieldError,
  FieldValues,
  Path,
  UseFormRegisterReturn,
} from 'react-hook-form';
import { SerieData } from '@/shared/types/series.interfaces';

export interface FormInputsProps {
  index: number;
  newSeries: SerieData[];
  setNewSeries: React.Dispatch<React.SetStateAction<SerieData[]>>;
  handleDataChange: (key: string, value: string) => void;
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

export interface GenericControllerProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  name: Path<T>;
}
