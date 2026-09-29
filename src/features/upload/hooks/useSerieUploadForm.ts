// hooks/useSerieUploadForm.ts
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

import { uploadSchema, type UploadFormValues } from '../schemas/serie.schema';
import { EMPTY_SERIE, toSerieForm } from '../utils/serie';
import { SerieData } from '@/shared/types/series.interfaces';

export function useSerieUploadForm(initial: SerieData[]) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      series: initial.length ? initial.map(toSerieForm) : [EMPTY_SERIE],
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, trigger, setError, formState } = form;

  const { fields, append, remove } = useFieldArray({ control, name: 'series' });
  const total = fields.length;

  const prefix = `series.${currentIndex}` as const;
  const serieErrors = formState.errors.series?.[currentIndex];

  const next = async () => {
    const valid = await trigger(prefix);
    if (valid) setCurrentIndex((i) => Math.min(i + 1, total - 1));
  };

  const prev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const addSerie = () => {
    append(EMPTY_SERIE);
    setCurrentIndex(total); // vai direto para a nova série
  };

  const removeSerie = (index: number) => {
    remove(index);
    setCurrentIndex((i) => Math.min(i, total - 2 < 0 ? 0 : total - 2));
  };

  const submit = handleSubmit(
    async ({ series }) => {
      try {
        await window.electronAPI.upload.uploadSeries(series);
        navigate('/');
      } catch {
        setError('root.server', {
          message: 'Falha ao enviar as séries. Tente novamente.',
        });
      }
    },
    (errors) => {
      const firstInvalid = errors.series?.findIndex?.((e) => e);
      if (typeof firstInvalid === 'number' && firstInvalid >= 0) {
        setCurrentIndex(firstInvalid);
      }
    },
  );

  return {
    form,
    fields,
    currentIndex,
    total,
    prefix,
    serieErrors,
    next,
    prev,
    addSerie,
    removeSerie,
    submit,
    isSubmitting: formState.isSubmitting,
    serverError: formState.errors.root?.server?.message,
  };
}
