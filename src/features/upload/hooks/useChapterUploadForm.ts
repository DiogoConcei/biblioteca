import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { computeOrder } from '../utils/chapter';
import {
  chapterUploadSchema,
  type ChapterUploadFormValues,
} from '../schemas/chapterUpload.schema';
import {
  ChapterData,
  DisplayChapterItem,
  ChapterUploadPayload,
  FailedItem,
} from '../types/upload.interfaces';
import { useUploadStore } from '../store/uploadStore';
import useExistingChapters from './useExistingChapters';

interface Options {
  onSuccess: () => void;
}

export default function useChapterUploadForm(
  initial: ChapterData[],
  { onSuccess }: Options,
) {
  const [serieId, setSerieId] = useState(0);
  const [currentNewIndex, setCurrentNewIndex] = useState(0);
  const [positionDraft, setPositionDraft] = useState('1');
  const {
    existingItems,
    isLoadingExisting,
    loadError,
    refetch: refetchExisting,
  } = useExistingChapters(serieId);

  const form = useForm<ChapterUploadFormValues>({
    resolver: zodResolver(chapterUploadSchema),
    defaultValues: {
      serieId: 0,
      chapters: initial.map((chapter, idx) => ({
        key: `new-${chapter.oldPath}`,
        label: chapter.name,
        order: idx + 1,
        sourcePath: chapter.oldPath,
      })),
    },
    mode: 'onChange',
  });

  const { control, setValue, getValues, handleSubmit, setError, formState } = form;
  const watchedChapters = useWatch({ control, name: 'chapters' });

  const newItemCount = watchedChapters?.length ?? 0;
  const focusedKey = watchedChapters?.[currentNewIndex]?.key;

  const mergedSorted: DisplayChapterItem[] = useMemo(() => {
    const newDisplay: DisplayChapterItem[] = (watchedChapters ?? []).map(
      (c, formIndex) => ({
        key: c.key,
        kind: 'new' as const,
        label: c.label,
        order: c.order,
        sourcePath: c.sourcePath,
        formIndex,
      }),
    );
    return [...existingItems, ...newDisplay].sort((a, b) => a.order - b.order);
  }, [existingItems, watchedChapters]);

  const focusedPosition = useMemo(
    () => mergedSorted.findIndex((item) => item.key === focusedKey) + 1,
    [mergedSorted, focusedKey],
  );

  useEffect(() => {
    if (focusedPosition > 0) setPositionDraft(String(focusedPosition));
  }, [focusedPosition]);

  const prevFocus = () => setCurrentNewIndex((i) => Math.max(i - 1, 0));
  const nextFocus = () => setCurrentNewIndex((i) => Math.min(i + 1, newItemCount - 1));

  const selectSerie = (id: number | null) => {
    setSerieId(id ?? 0);
    setValue('serieId', id ?? 0, { shouldValidate: id !== null });
    setCurrentNewIndex(0);
  };

  const applyOrder = (key: string, order: number) => {
    const chapters = getValues('chapters');
    const formIndex = chapters.findIndex((c) => c.key === key);
    if (formIndex === -1) {
      console.warn('[applyOrder] key não encontrada no form', {
        key,
        keysDoForm: chapters.map((c) => c.key),
      });
      return;
    }

    setValue(`chapters.${formIndex}.order`, order, { shouldDirty: true });
  };

  const placeAt = (key: string, targetIndex: number) => {
    const rest = mergedSorted.filter((item) => item.key !== key);
    const prev = rest[targetIndex - 1]?.order;
    const next = rest[targetIndex]?.order;
    const result = computeOrder(prev, next);

    applyOrder(key, result);
  };

  const moveItem = (key: string, direction: 'up' | 'down') => {
    const index = mergedSorted.findIndex((item) => item.key === key);
    const target = direction === 'up' ? index - 1 : index + 1;

    if (index === -1 || target < 0 || target >= mergedSorted.length) {
      console.warn('[moveItem] abortou (fora dos limites ou key inexistente)');
      return;
    }
    placeAt(key, target);
  };

  const moveRelativeTo = (
    draggedKey: string,
    targetKey: string,
    position: 'before' | 'after',
  ) => {
    if (draggedKey === targetKey) return;
    const rest = mergedSorted.filter((item) => item.key !== draggedKey);
    const targetIndex = rest.findIndex((item) => item.key === targetKey);
    if (targetIndex === -1) return;
    placeAt(draggedKey, position === 'before' ? targetIndex : targetIndex + 1);
  };
  const commitPosition = () => {
    if (!focusedKey) return;

    const parsed = parseInt(positionDraft, 10);
    if (Number.isNaN(parsed)) {
      setPositionDraft(String(focusedPosition));
      return;
    }

    const pos = Math.min(Math.max(parsed, 1), mergedSorted.length);
    placeAt(focusedKey, pos - 1);
    setPositionDraft(String(pos));
  };

  const submit = handleSubmit(async (values) => {
    try {
      const payload: ChapterUploadPayload = {
        serieId: values.serieId,
        chapters: values.chapters.map((c) => ({
          sourcePath: c.sourcePath,
          label: c.label,
          order: c.order,
        })),
      };

      const res = await window.electronAPI.upload.uploadChapter(payload);

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Falha ao enviar os capítulos.');
      }

      const { succeeded, failed } = res.data;

      if (failed.length === 0) {
        onSuccess();
        return;
      }

      const remaining = getValues('chapters').filter(
        (c) => !succeeded.includes(c.sourcePath),
      );
      setValue('chapters', remaining);
      setCurrentNewIndex(0);
      refetchExisting();
      setError('root.server', {
        message: `${failed.length} capítulo(s) falharam: ${failed.map((f: FailedItem) => f.reason).join('; ')}`,
      });
    } catch (error) {
      console.error('Erro ao enviar capítulos:', error);
      setError('root.server', {
        message: error instanceof Error ? error.message : 'Falha ao enviar os capítulos.',
      });
    }
  });

  return {
    form,
    existingItems,
    isLoadingExisting,
    loadError,
    mergedSorted,
    focusedKey,
    currentNewIndex,
    setCurrentNewIndex,
    newItemCount,
    prevFocus,
    nextFocus,
    positionDraft,
    setPositionDraft,
    commitPosition,
    selectSerie,
    moveItem,
    moveRelativeTo,
    submit,
    isSubmitting: formState.isSubmitting,
    serverError: formState.errors.root?.server?.message,
  };
}
