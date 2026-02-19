import { useEffect, useMemo } from 'react';
import {
  Controller,
  SubmitHandler,
  useForm,
  useFieldArray,
  useWatch,
} from 'react-hook-form';

import useAllSeries from '@/hooks/useAllSeries';
import { Collection, SerieInCollection } from '@/types/collections.interfaces';
import { Status } from '../../../electron/types/manga.interfaces';
import styles from './CreateCollection.module.scss';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    // OBS: agora espera que o backend aceite seriesCoverId quando coverType === 'series'
    collection: Omit<Collection, 'createdAt' | 'updatedAt'> & {
      seriesCoverId?: number | null;
    },
  ) => Promise<void>;
}

interface SelectedSerieData {
  id: number;
  rating: number;
  status: Status;
}

interface CreateCollectionFormValues {
  name: string;
  description: string;
  comments: string;
  coverType: 'external' | 'series';
  externalCover: string;
  seriesCoverId: string; // agora guarda o id (string) da série escolhida como capa
  selectedSeries: SelectedSerieData[]; // array -> evita problemas com FieldPath dinâmicos
}

const STATUS_OPTIONS: Status[] = ['', 'Em andamento', 'Completo', 'Pendente'];

const defaultValues: CreateCollectionFormValues = {
  name: '',
  description: '',
  comments: '',
  coverType: 'external',
  externalCover: '',
  seriesCoverId: '',
  selectedSeries: [],
};

export default function CreateCollection({
  isOpen,
  onClose,
  onCreate,
}: CreateCollectionModalProps) {
  const series = useAllSeries();
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
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'selectedSeries',
  });

  const watchedSelected = (useWatch({
    control,
    name: 'selectedSeries',
  }) ?? []) as SelectedSerieData[];

  const coverType = watch('coverType');

  // Sempre limpe o campo de capa incompatível ao trocar o tipo de cover
  useEffect(() => {
    if (coverType === 'external') {
      setValue('seriesCoverId', '');
    } else {
      setValue('externalCover', '');
    }
  }, [coverType, setValue]);

  // Toggle: adiciona ou remove da fieldArray com índices seguros
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

  // Lista de dados completos (para mostrar nome/capa/etc) das séries que estão selecionadas
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

  const buildCollectionSeries = (): SerieInCollection[] => {
    const now = new Date().toISOString();

    return watchedSelected
      .map((sel, index) => {
        const meta = selectableSeries.find((ser) => ser.id === sel.id);
        if (!meta) return null;
        return {
          id: meta.id,
          name: meta.name,
          coverImage: '', // backend deve preencher a URL/path correto
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

    // coverImage permanece apenas quando for external; quando for series,
    // enviamos seriesCoverId para o backend escolher a imagem correta.
    const coverImage =
      values.coverType === 'external' ? values.externalCover.trim() : '';

    const seriesCoverId =
      values.coverType === 'series' && values.seriesCoverId
        ? Number(values.seriesCoverId)
        : null;

    await onCreate({
      name: values.name.trim(),
      description: values.description.trim(),
      coverImage,
      // campo extra para backend: id da série escolhida como capa (se houver)
      seriesCoverId,
      comments: values.comments
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean),
      series: buildCollectionSeries(),
    } as any); // cast por segurança caso o tipo Collection não tenha seriesCoverId

    reset(defaultValues);
    onClose();
  };

  // não renderiza se modal fechado
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
        <h2>Criar coleção</h2>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <label>
            Nome da coleção
            <input
              {...register('name', { required: true })}
              placeholder="Ex.: Isekai favoritos"
            />
          </label>

          <label>
            Descrição
            <textarea
              {...register('description')}
              placeholder="Descreva o objetivo da coleção"
            />
          </label>

          <label>
            Comentários (um por linha)
            <textarea
              {...register('comments')}
              placeholder="Ex.: Ler no fim de semana"
            />
          </label>

          <div className={styles.coverSection}>
            <span>Capa da coleção</span>
            <div className={styles.coverType}>
              <label>
                <input
                  type="radio"
                  value="external"
                  {...register('coverType')}
                />
                URL externa
              </label>
              <label>
                <input type="radio" value="series" {...register('coverType')} />
                Capa de uma série selecionada
              </label>
            </div>

            {coverType === 'external' ? (
              <input {...register('externalCover')} placeholder="https://..." />
            ) : (
              <select {...register('seriesCoverId')}>
                <option value="">Selecione uma capa</option>
                {/* agora o value é o id da série (string) */}
                {selectedSeriesList.map((sel) => (
                  <option key={sel.id} value={String(sel.meta.id)}>
                    {sel.meta.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.seriesSection}>
            <h3>Séries da coleção</h3>
            <ul>
              {selectableSeries.map((serie) => {
                const isSelected = watchedSelected.some(
                  (s) => s.id === serie.id,
                );
                const selIndex = watchedSelected.findIndex(
                  (s) => s.id === serie.id,
                );

                return (
                  <li key={serie.id} className={styles.serieItem}>
                    <label className={styles.serieName}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSerie(serie.id)}
                      />
                      {serie.name}
                    </label>

                    {isSelected && selIndex >= 0 && (
                      <div className={styles.serieMeta}>
                        <label>
                          Rating
                          <Controller
                            control={control}
                            name={`selectedSeries.${selIndex}.rating` as const}
                            render={({ field }) => (
                              <select
                                value={field.value ?? 0}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              >
                                {Array.from({ length: 11 }).map((_, i) => (
                                  <option key={i} value={i}>
                                    {i}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                        </label>

                        <label>
                          Status
                          <Controller
                            control={control}
                            name={`selectedSeries.${selIndex}.status` as const}
                            render={({ field }) => (
                              <select
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value as Status)
                                }
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <option
                                    key={status || 'empty'}
                                    value={status}
                                  >
                                    {status || 'Sem status'}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                        </label>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

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
        </form>
      </div>
    </div>
  );
}
