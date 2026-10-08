import type { SerieData } from '@/shared/types/series.interfaces';
import {
  LiteratureForm,
  ReadingStatus,
  PrivacyStatus,
  AutoBackupStatus,
} from '@/shared/types/series.interfaces';
import type { UploadFormValues } from '../schemas/upload.schema';

export type SerieFormValues = UploadFormValues['series'][number];

export const EMPTY_SERIE: SerieFormValues = {
  name: '',
  sanitizedName: '',
  genre: '',
  author: '',
  cover_path: '',
  language: '',
  privacy: PrivacyStatus.EMPTY,
  autoBackup: AutoBackupStatus.EMPTY,
  readingStatus: ReadingStatus.EMPTY,
  literatureForm: LiteratureForm.EMPTY,
  tags: [],
  collections: [],
  archivesPath: '',
  chaptersPath: '',
  oldPath: '',
  createdAt: '',
  deletedAt: '',
};

export function toSerieForm(data: SerieData): SerieFormValues {
  return { ...EMPTY_SERIE, ...data };
}
