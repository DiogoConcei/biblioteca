import { useEffect, useMemo } from 'react';
import {
  SubmitHandler,
  useForm,
  useFieldArray,
  useWatch,
} from 'react-hook-form';

import {
  SerieInCollection,
  CreateCollectionDTO,
} from '@/types/collections.interfaces';
import { Status } from 'electron/types/electron-auxiliar.interfaces';

import styles from './CreateCollection.module.scss';
import ImageController from '../Form/Fields/ImageController/ImageController';
import {
  CreateCollectionModalProps,
  CreateCollectionFormValues,
  SelectedSerieData,
} from '../../types/components.interfaces';

const defaultValues: CreateCollectionFormValues = {
  name: '',
  description: '',
  coverType: 'external',
  coverImage: '',
  seriesCoverId: '',
  selectedSeries: [],
};

export default function CreateCollection({
  isOpen,
  onClose,
  onCreate,
  series,
}: CreateCollectionModalProps) {
  const selectableSeries = useMemo(() => series ?? [], [series]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateCollectionFormValues>({
    defaultValues,
  });

  const { append, remove } = useFieldArray({
    control,
    name: 'selectedSeries',
  });

  const watchedSelectedRaw = useWatch({
    control,
    name: 'selectedSeries',
  });

  const watchedSelected = useMemo(
    () => (watchedSelectedRaw ?? []) as SelectedSerieData[],
    [watchedSelectedRaw],
  );

  const coverType = watch('coverType');
  const selectedCoverId = watch('seriesCoverId');

  /**
   * Monta lista das séries selecionadas com seus dados completos
   */
  const selectedSeriesList = useMemo(() => {
    return watchedSelected
      .map((s) => ({
        ...s,
        meta: selectableSeries.find((ser) => ser.id === s.id),
      }))
      .filter((s) => s.meta) as (SelectedSerieData & {
      meta: (typeof selectableSeries)[number];
    })[];
  }, [watchedSelected, selectableSeries]);

  /**
   * Se for capa de série, JOGA SÓ NO CAMPO de preview (coverImage) para exibir no ImageController.
   * Importante: isso NÃO significa que vamos salvar o base64 no backend — o onSubmit decide o payload.
   */
  useEffect(() => {
    if (coverType !== 'series') return;

    const selected = selectedSeriesList.find(
      (s) => String(s.meta.id) === selectedCoverId,
    );

    if (!selected) return;

    // Meta.coverImage é base64 vindo do banco — usamos só para preview.
    setValue('coverImage', selected.meta.coverImage);
  }, [coverType, selectedCoverId, selectedSeriesList, setValue]);

  /**
   * Adiciona ou remove série da coleção
   */
  const toggleSerie = (serieId: number) => {
    const idx = watchedSelected.findIndex((s) => s.id === serieId);

    if (idx >= 0) {
      remove(idx);
      return;
    }

    append({
      id: serieId,
      rating: 0,
      status: '' as Status,
    });
  };

  /**
   * Constrói estrutura final de séries
   */
  const buildCollectionSeries = (): SerieInCollection[] => {
    const now = new Date().toISOString();

    return watchedSelected
      .map((sel, index) => {
        const meta = selectableSeries.find((ser) => ser.id === sel.id);
        if (!meta) return null;

        return {
          id: meta.id,
          name: meta.name,
          coverImage: meta.coverImage,
          description: '',
          archivesPath: meta.dataPath,
          totalChapters: meta.totalChapters,
          status: sel.status ?? '',
          recommendedBy: '',
          originalOwner: '',
          rating: sel.rating ?? 0,
          addAt: now,
          position: index + 1,
        } as SerieInCollection;
      })
      .filter(Boolean) as SerieInCollection[];
  };

  const onSubmit: SubmitHandler<CreateCollectionFormValues> = async (
    values,
  ) => {
    if (!values.name.trim()) return;

    // --- NOVA LÓGICA: decidir payload final enviado ao backend ---
    // Se external: envie coverImage (pode ser path salvo pelo ImageController ou data: url),
    // Se series: envie null/'' em coverImage e só envie seriesCoverId (number).
    const coverImageToSend =
      values.coverType === 'external' ? values.coverImage : '';
    const seriesCoverIdToSend =
      values.coverType === 'series' && values.seriesCoverId
        ? Number(values.seriesCoverId)
        : null;

    await onCreate({
      name: values.name.trim(),
      description: values.description.trim(),
      coverImage: coverImageToSend,
      seriesCoverId: seriesCoverIdToSend,
      series: buildCollectionSeries(),
    } as CreateCollectionDTO);

    reset(defaultValues);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        reset(defaultValues);
        onClose();
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.imageControlWrapper}>
            <ImageController control={control} name="coverImage" />
          </div>

          <div className={styles.inputArea}>
            <label>
              Nome da coleção
              <input
                {...register('name', { required: true })}
                placeholder="Ex.: Isekai favoritos"
                type="text"
              />
            </label>

            <div className={styles.coverSection}>
              <div className={styles.coverType}>
                <span>Capa</span>

                <input
                  type="radio"
                  value="external"
                  id="TypeCoverExternal"
                  {...register('coverType')}
                />
                <label htmlFor="TypeCoverExternal">upload de capa</label>

                <input
                  type="radio"
                  value="series"
                  id="TypeCoverInternal"
                  {...register('coverType')}
                />
                <label htmlFor="TypeCoverInternal">
                  a partir de série selecionada
                </label>
              </div>

              {coverType === 'series' && selectedSeriesList.length > 0 && (
                <div className={styles.seriesCoverOptions}>
                  {selectedSeriesList.map((sel) => (
                    <div key={sel.id}>
                      <input
                        type="radio"
                        id={`seriesCover-${sel.id}`}
                        value={String(sel.meta.id)}
                        {...register('seriesCoverId')}
                      />
                      <label htmlFor={`seriesCover-${sel.id}`}>
                        {sel.meta.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.seriesSection}>
              <h3>Séries da coleção</h3>

              <div className={styles.seriesGrid}>
                {selectableSeries.map((serie) => {
                  const isSelected = watchedSelected.some(
                    (s) => s.id === serie.id,
                  );

                  return (
                    <button
                      key={serie.id}
                      type="button"
                      className={`${styles.serieCard} ${
                        isSelected ? styles.active : ''
                      }`}
                      onClick={() => toggleSerie(serie.id)}
                    >
                      <img
                        src={serie.coverImage}
                        alt={`Capa da série ${serie.name}`}
                      />
                      <span>{serie.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className={styles.areaLabel}>
              Descrição
              <textarea
                {...register('description')}
                placeholder="Descrição da coleção"
              />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => {
                  reset(defaultValues);
                  onClose();
                }}
              >
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Criar coleção'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
