import * as z from 'zod';
import {
  ReadingStatus,
  PrivacyStatus,
  AutoBackupStatus,
  LiteratureForm,
} from '@/shared/types/series.interfaces';

const serieSchema = z.object({
  name: z.string().min(1),
  sanitizedName: z.string().min(1),
  genre: z.string().min(1),
  author: z.string().min(1),
  language: z.string().min(1),
  cover_path: z.string().min(1),
  privacy: z.enum(PrivacyStatus),
  autoBackup: z.enum(AutoBackupStatus),
  readingStatus: z.enum(ReadingStatus),
  literatureForm: z.enum(LiteratureForm),
  tags: z.array(z.string()),
  collections: z.array(z.string()),
  archivesPath: z.string(),
  chaptersPath: z.string(),
  oldPath: z.string().min(1),
  createdAt: z.string().min(1),
  deletedAt: z.string(),
});

export const uploadSchema = z.object({ series: z.array(serieSchema).min(1) });
export type UploadFormValues = z.infer<typeof uploadSchema>;
