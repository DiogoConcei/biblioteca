import { FormEvent, useMemo, useState } from 'react';

import useAllSeries from '@/hooks/useAllSeries';
import { Collection, SerieInCollection } from '@/types/collections.interfaces';

import { Status } from '../../../electron/types/manga.interfaces';
import styles from './CreateCollection.module.scss';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    collection: Omit<Collection, 'createdAt' | 'updatedAt'>,
  ) => Promise<void>;
}

interface SelectedSerieData {
  rating: number;
  status: Status;
}

const STATUS_OPTIONS: Status[] = ['', 'Em andamento', 'Completo', 'Pendente'];

export default function CreateCollection({
  isOpen,
  onClose,
  onCreate,
}: CreateCollectionModalProps) {
  const series = useAllSeries();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [comments, setComments] = useState('');
  const [coverType, setCoverType] = useState<'external' | 'series'>('external');
  const [externalCover, setExternalCover] = useState('');
  const [seriesCover, setSeriesCover] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<
    Record<number, SelectedSerieData>
  >({});
  const [saving, setSaving] = useState(false);

  const selectableSeries = useMemo(() => series ?? [], [series]);

  const selectedSeriesList = useMemo(
    () =>
      selectableSeries.filter((serie) =>
        Object.prototype.hasOwnProperty.call(selectedSeries, serie.id),
      ),
    [selectableSeries, selectedSeries],
  );

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setDescription('');
    setComments('');
    setCoverType('external');
    setExternalCover('');
    setSeriesCover('');
    setSelectedSeries({});
  };

  const toggleSerie = (serieId: number) => {
    setSelectedSeries((current) => {
      if (current[serieId]) {
        const updated = { ...current };
        delete updated[serieId];
        return updated;
      }

      return {
        ...current,
        [serieId]: {
          rating: 0,
          status: '',
        },
      };
    });
  };

  const updateSerieData = (
    serieId: number,
    key: keyof SelectedSerieData,
    value: number | Status,
  ) => {
    setSelectedSeries((current) => ({
      ...current,
      [serieId]: {
        ...current[serieId],
        [key]: value,
      },
    }));
  };

  const buildCollectionSeries = (): SerieInCollection[] => {
    const now = new Date().toISOString();

    return selectedSeriesList.map((serie) => ({
      id: serie.id,
      name: serie.name,
      coverImage: serie.coverImage,
      description: '',
      archivesPath: serie.dataPath,
      totalChapters: serie.totalChapters,
      status: selectedSeries[serie.id]?.status ?? '',
      recommendedBy: '',
      originalOwner: '',
      rating: selectedSeries[serie.id]?.rating ?? 0,
      addAt: now,
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) return;

    setSaving(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        coverImage:
          coverType === 'external' ? externalCover.trim() : seriesCover,
        comments: comments
          .split('\n')
          .map((comment) => comment.trim())
          .filter(Boolean),
        series: buildCollectionSeries(),
      });

      resetForm();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Criar coleção</h2>

        <form onSubmit={onSubmit} className={styles.form}>
          <label>
            Nome da coleção
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Ex.: Isekai favoritos"
            />
          </label>

          <label>
            Descrição
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva o objetivo da coleção"
            />
          </label>

          <label>
            Comentários (um por linha)
            <textarea
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              placeholder="Ex.: Ler no fim de semana"
            />
          </label>

          <div className={styles.coverSection}>
            <span>Capa da coleção</span>
            <div className={styles.coverType}>
              <label>
                <input
                  type="radio"
                  name="cover-type"
                  checked={coverType === 'external'}
                  onChange={() => setCoverType('external')}
                />
                URL externa
              </label>
              <label>
                <input
                  type="radio"
                  name="cover-type"
                  checked={coverType === 'series'}
                  onChange={() => setCoverType('series')}
                />
                Capa de uma série selecionada
              </label>
            </div>

            {coverType === 'external' ? (
              <input
                value={externalCover}
                onChange={(event) => setExternalCover(event.target.value)}
                placeholder="https://..."
              />
            ) : (
              <select
                value={seriesCover}
                onChange={(event) => setSeriesCover(event.target.value)}
              >
                <option value="">Selecione uma capa</option>
                {selectedSeriesList.map((serie) => (
                  <option key={serie.id} value={serie.coverImage}>
                    {serie.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.seriesSection}>
            <h3>Séries da coleção</h3>
            <ul>
              {selectableSeries.map((serie) => {
                const selected = selectedSeries[serie.id];

                return (
                  <li key={serie.id} className={styles.serieItem}>
                    <label className={styles.serieName}>
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleSerie(serie.id)}
                      />
                      {serie.name}
                    </label>

                    {selected && (
                      <div className={styles.serieMeta}>
                        <label>
                          Rating
                          <select
                            value={selected.rating}
                            onChange={(event) =>
                              updateSerieData(
                                serie.id,
                                'rating',
                                Number(event.target.value),
                              )
                            }
                          >
                            {Array.from({ length: 11 }).map((_, index) => (
                              <option key={index} value={index}>
                                {index}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Status
                          <select
                            value={selected.status}
                            onChange={(event) =>
                              updateSerieData(
                                serie.id,
                                'status',
                                event.target.value as Status,
                              )
                            }
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status || 'empty'} value={status}>
                                {status || 'Sem status'}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Criar coleção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
