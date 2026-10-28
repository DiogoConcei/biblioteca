import styles from './EditSerie.module.scss';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import {
  LiteratureForm,
  ReadingStatus,
  SerieEditForm,
  PrivacyStatus,
  AutoBackupStatus,
} from '@/shared/types/series.interfaces';
import { useNavigate, useParams } from 'react-router-dom';
import useSerie from '@/shared/hooks/useSerie';
import useSerieStore from '@/shared/store/useSerieStore';
import { useUIStore } from '@/shared/store/useUIStore';
import Loading from '@/shared/components/Loading/Loading';
import ImageGallery from '../components/SeriePotrait/SeriePotrait';
import Favorite from '@/shared/components/FavoriteButton/Favorite';
import CollectionButton from '@/shared/components/CollectionButton/CollectionButton';
import Rating from '@/shared/components/Rating/Rating';
import { Literatures } from '../../../../electron/types/electron-auxiliar.interfaces';
import { useState } from 'react';
import { Eye, EyeOff, Trash2, Undo2, Pencil, Search } from 'lucide-react';
import Segmented from '../components/Segmented/Segmented';
import TextInput from '@/shared/components/TextInput/TextInput';
import ErrorScreen from '@/shared/components/ErrorScreen/ErrorScreen';
import TagsField from '@/features/upload/components/TagsField/TagsField';

type ChapterId = SerieEditForm['chapters'][number]['id'];

export default function EditSerie() {
  const { serie_name = '', literature_form = '' } = useParams<{
    literature_form: string;
    serie_name: string;
  }>();

  const decodedSerieName = decodeURIComponent(serie_name);
  const navigate = useNavigate();

  useSerie(decodedSerieName, literature_form);
  const loading = useUIStore((state) => state.loading);
  const error = useUIStore((state) => state.error);
  const serie = useSerieStore((state) => state.serie);
  const chapters = useSerieStore((state) => state.chapters);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SerieEditForm>({
    values: serie
      ? ({
          name: serie.name,
          sanitizedName: serie.sanitizedName,
          genre: serie.genre,
          author: serie.author,
          language: serie.language,
          coverImage: serie.coverImage || '',
          archivesPath: serie.archivesPath,
          chaptersPath: serie.chaptersPath,
          dataPath: serie.dataPath,
          chapters: chapters || [],
          totalChapters: serie.totalChapters,
          chaptersRead: serie.chaptersRead,
          literatureForm: serie.literatureForm as LiteratureForm,
          readingData: {
            lastChapterId: serie.readingData.lastChapterId,
            lastReadAt: serie.readingData.lastReadAt,
          },
          metadata: {
            status: serie.metadata.status as ReadingStatus,
            collections: serie.metadata.collections || [],
            recommendedBy: serie.metadata.recommendedBy || '',
            originalOwner: serie.metadata.originalOwner || '',
            lastDownload: serie.metadata.lastDownload || '',

            privacy: serie.metadata.privacy || PrivacyStatus.PUBLIC,
            rating: serie.metadata.rating || 0,
            isFavorite: serie.metadata.isFavorite || false,
            autoBackup: serie.metadata.autoBackup || AutoBackupStatus.NO,
          },
          comments: serie.comments || '',
          tags: serie.tags || [],
          deletedAt: serie.deletedAt || '',
          createdAt: serie.createdAt,
        } as SerieEditForm)
      : undefined,
  });

  const { fields } = useFieldArray({ control, name: 'chapters', keyName: 'key' });
  const [removed, setRemoved] = useState<Set<ChapterId>>(new Set());
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ id: ChapterId; original: string } | null>(
    null,
  );
  const watched = watch('chapters') ?? [];

  if (error) return <ErrorScreen error={error} serieName={serie_name} />;

  if (loading || !serie) return <Loading />;
  const hasChapters = watched.length > 0;
  const active = watched.filter((c) => !removed.has(c.id));
  const chaptersRead = hasChapters
    ? active.filter((c) => c.isRead).length
    : serie.chaptersRead || 0;
  const total = hasChapters ? active.length : serie.totalChapters || 0;
  const percent = total ? Math.min(100, (chaptersRead / total) * 100) : 0;

  const toggleRead = (index: number) =>
    setValue(`chapters.${index}.isRead`, !watched[index].isRead, { shouldDirty: true });

  const toggleRemoved = (id: ChapterId) =>
    setRemoved((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const visible = fields
    .map((field, index) => ({ field, index }))
    .filter(({ index }) =>
      watched[index]?.name.toLowerCase().includes(query.trim().toLowerCase()),
    );

  const onSubmit: SubmitHandler<SerieEditForm> = (data) => {
    const kept = data.chapters.filter((c) => !removed.has(c.id));
    console.log({
      ...data,
      chapters: kept,
      chaptersRead: kept.filter((c) => c.isRead).length,
    });
  };

  return (
    <form className={styles['form-view']} onSubmit={handleSubmit(onSubmit)}>
      <aside className={styles.sidebar}>
        <ImageGallery control={control} name="coverImage" />
        <div className={styles.actionButtons}>
          <Favorite serie={serie} />
          <Rating serie={serie} />
          <CollectionButton serie={serie} />
        </div>

        <dl className={styles.stats}>
          <div>
            <dt>Criado em</dt>
            <dd>{new Date(serie.createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt>Último download</dt>
            <dd title={new Date(serie.metadata.lastDownload).toLocaleString()}>
              {serie.metadata.lastDownload
                ? new Date(serie.metadata.lastDownload).toLocaleDateString()
                : '—'}
            </dd>
          </div>
          {chaptersRead > 0 && (
            <div>
              <dt>Último lido</dt>
              <dd>{serie.readingData.lastChapterId}</dd>
            </div>
          )}
        </dl>
      </aside>

      <div className={styles.center}>
        <h1>
          Editando: <span>{serie.name}</span>
        </h1>

        <div className={styles.topRow}>
          <section className={styles.section}>
            <h2>Informações</h2>
            <div className={styles.list}>
              <TextInput
                register={register('name', { required: true })}
                error={errors.name}
                msg="Nome da série"
              />
              <TextInput
                register={register('author', { required: true })}
                error={errors.author}
                msg="Autor"
              />
              <TextInput
                register={register('genre', { required: true })}
                error={errors.genre}
                msg="Gênero da série"
              />
              <TextInput
                register={register('language', { required: true })}
                error={errors.language}
                msg="Idioma"
              />
            </div>
          </section>

          <section className={styles.section}>
            <h2>Organização</h2>
            <div className={styles.list}>
              <Segmented
                control={control}
                name="metadata.status"
                label="Status"
                options={Object.values(ReadingStatus)}
              />
              <Segmented
                control={control}
                name="metadata.privacy"
                label="Privacidade"
                options={Object.values(PrivacyStatus)}
              />
              <Segmented
                control={control}
                name="metadata.autoBackup"
                label="Backup"
                options={Object.values(AutoBackupStatus)}
              />
              <div className={styles.field}>
                <span className={styles.label}>Tags</span>
                <TagsField control={control} />
              </div>
            </div>
          </section>
        </div>

        <section className={`${styles.section} ${styles.description}`}>
          <h2>Descrição</h2>
          <textarea
            {...register('comments')}
            aria-label="Descrição"
            placeholder="Sinopse, anotações..."
          />
        </section>

        <section className={`${styles.section} ${styles.chaptersPanel}`}>
          <div className={styles.sectionHeader}>
            <h2>Capítulos</h2>
            <div className={styles.progress}>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: `${percent}%` }} />
              </div>
              <span className={styles.count}>
                {chaptersRead} / {total}
              </span>
            </div>
            <label className={styles.search}>
              <Search size={16} />
              <input
                type="search"
                placeholder="Buscar capítulo"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </label>
          </div>

          {hasChapters ? (
            <ul className={styles.chaptersList}>
              {visible.map(({ field, index }) => {
                const chapter = watched[index];
                const isRemoved = removed.has(chapter.id);
                const isEditing = editing?.id === chapter.id;
                const nameReg = register(`chapters.${index}.name`);

                return (
                  <li
                    key={field.key}
                    className={styles.chapter}
                    data-read={chapter.isRead}
                    data-removed={isRemoved}
                  >
                    {isEditing ? (
                      <input
                        {...nameReg}
                        autoFocus
                        className={styles.renameInput}
                        onBlur={(e) => {
                          nameReg.onBlur(e);
                          setEditing(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setEditing(null);
                          }
                          if (e.key === 'Escape') {
                            setValue(
                              `chapters.${index}.name`,
                              editing?.original ?? chapter.name,
                              { shouldDirty: true },
                            );
                            setEditing(null);
                          }
                        }}
                      />
                    ) : (
                      <span
                        className={styles.chapterName}
                        onDoubleClick={() =>
                          !isRemoved &&
                          setEditing({ id: chapter.id, original: chapter.name })
                        }
                      >
                        {chapter.name}
                      </span>
                    )}

                    <div className={styles.rowActions}>
                      {isRemoved ? (
                        <button
                          type="button"
                          onClick={() => toggleRemoved(chapter.id)}
                          aria-label="Restaurar capítulo"
                        >
                          <Undo2 size={18} />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setEditing({ id: chapter.id, original: chapter.name })
                            }
                            aria-label="Renomear capítulo"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRead(index)}
                            aria-label={
                              chapter.isRead ? 'Marcar como não lido' : 'Marcar como lido'
                            }
                          >
                            {chapter.isRead ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button
                            type="button"
                            className={styles.danger}
                            onClick={() => toggleRemoved(chapter.id)}
                            aria-label="Remover capítulo"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.empty}>Nenhum capítulo nesta série.</p>
          )}
        </section>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => navigate('/')}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setRemoved(new Set());
          }}
        >
          Limpar
        </button>
        <button
          type="submit"
          className={styles.primary}
          disabled={!isDirty && removed.size === 0}
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
