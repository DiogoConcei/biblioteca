// schemas/chapterUpload.schema.ts
import { z } from 'zod';

export const chapterItemSchema = z.object({
  key: z.string(),
  label: z.string().trim().min(1, 'Informe o nome do capítulo'),
  order: z.number(),
  sourcePath: z.string(),
});

export const chapterUploadSchema = z.object({
  serieId: z.number({ error: 'Selecione uma série' }).positive('Selecione uma série'),
  chapters: z.array(chapterItemSchema).min(1, 'Nenhum capítulo para enviar'),
});

export type ChapterUploadFormValues = z.infer<typeof chapterUploadSchema>;
