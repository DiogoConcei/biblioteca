import { SerieData } from '@/shared/types/series.interfaces';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UploadFormValues, uploadSchema } from '@/features/upload/schemas/serie.schema';
import { EMPTY_SERIE, toSerieForm, SerieFormValues } from '@/features/upload/utils/serie';

export function useSerieUploadForm(initial: SerieData[]) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { series: initial.length ? initial.map(toSerieForm) : [EMPTY_SERIE] },
    mode: 'onChange',
  });

  const { fields } = useFieldArray({ control: form.control, name: 'series' });
  const total = fields.length;

  const next = async () => {
    if (await form.trigger(`series.${currentIndex}`)) {
      setCurrentIndex((i) => Math.min(i + 1, total - 1));
    }
  };
  const prev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  const submit = form.handleSubmit(
    async ({ series }) => {
      try {
        await window.electronAPI.upload.uploadSeries(series);
        navigate('/');
      } catch {
        form.setError('root.server', { message: 'Falha no upload' });
      }
    },
    (errors) => {
      const firstInvalid = errors.series?.findIndex?.((e) => e) ?? -1;
      if (firstInvalid >= 0) setCurrentIndex(firstInvalid);
    },
  );

  return { form, currentIndex, total, next, prev, submit };
}
