import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EyeOff, Eye, ChevronLeft, ChevronRight, Trash } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';

import useSerie from '../../hooks/useSerie';
import useCollection from '../../hooks/useCollection';
import useSerieStore from '../../store/useSerieStore';
import { useUIStore } from '../../store/useUIStore';
import Favorite from '../../components/FavoriteButton/Favorite';
import Rating from '../../components/Rating/Rating';
import ImageController from '../../components/Form/Fields/ImageController/ImageController';
import TextInput from '../../components/Form/GenericInputs/TextInput/TextInput';
import BackupField from '../../components/Form/Fields/BackupField/BackupField';
import PrivacyField from '../../components/Form/Fields/PrivacyField/PrivacyField';
import StatusField from '../../components/Form/Fields/StatusField/StatusField';
import CollectionsField from '../../components/Form/Fields/CollectionsField/CollectionsField';
import TagsField from '../../components/Form/Fields/TagsField/TagsField';
import Loading from '../../components/Loading/Loading';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import { SerieEditForm } from '../../types/series.interfaces';
import {
  Literatures,
  LiteratureChapter,
} from '../../../electron/types/electron-auxiliar.interfaces';
import CollectionButton from '../../components/CollectionButton/CollectionButton';
import usePagination from '../../hooks/usePagination';
import styles from './EditSerie.module.scss';

export default function EditSerie() {
  const { serie_name: rawSerieName, literature_form: lForm } = useParams<{
    serie_name: string;
    literature_form: string;
  }>();
  const serie_name = decodeURIComponent(rawSerieName ?? '');
  const navigate = useNavigate();
  if (!rawSerieName || !lForm) {
    return null;
  }

  useSerie(serie_name, lForm);

  const serie = useSerieStore((state) => state.serie) as Literatures;
  const chapters = useSerieStore((state) => state.chapters);
  const setChapters = useSerieStore((state) => state.setChapters);
  const loading = useUIStore((state) => state.loading);
  const setLoading = useUIStore((state) => state.setLoading);
  const error = useUIStore((state) => state.error);
  const setError = useUIStore((state) => state.setError);
  const [oldChapters, setOldChapters] = useState<LiteratureChapter[]>([]);
  const { handlePage, pageNumbers, totalPages, currentItems, currentPage } =
    usePagination();

  const {
    setValue,
    watch,
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<SerieEditForm>({
    defaultValues: {
      coverImage: '',
      tags: [],
    },
    values: serie
      ? {
          name: serie.name,
          sanitizedName: serie.sanitizedName,
          genre: serie.genre,
          author: serie.author,
          language: serie.language,
          coverImage: serie.coverImage ? `${serie.coverImage}` : '',
          archivesPath: serie.archivesPath,
          chaptersPath: serie.chaptersPath,
          dataPath: serie.dataPath,
          chapters: serie.chapters as LiteratureChapter[],
          totalChapters: serie.totalChapters,
          chaptersRead: serie.chaptersRead,
          literatureForm: serie.literatureForm,
          readingData: {
            lastChapterId: serie.readingData.lastChapterId,
            lastReadAt: serie.readingData.lastReadAt,
          },
          metadata: {
            status: serie.metadata.status,
            collections: serie.metadata.collections || [],
            recommendedBy: serie.metadata.recommendedBy,
            originalOwner: serie.metadata.originalOwner,
            lastDownload: serie.metadata.lastDownload,
            privacy: serie.metadata.privacy,
            rating: serie.metadata.rating,
            isFavorite: serie.metadata.isFavorite,
            autoBackup: serie.metadata.autoBackup,
          },
          comments: serie.comments,
          tags: serie.tags,
          deletedAt: serie.deletedAt || '',
          createdAt: serie.createdAt,
        }
      : undefined,
  });
  const chaptersRead = watch('chaptersRead');

  const isRead = async (e: React.MouseEvent, chapter: LiteratureChapter) => {
    e.stopPropagation();

    const originalRead = chapter.isRead;

    const currentRead = Number(chaptersRead) || 0;
    const delta = originalRead ? -1 : 1;

    setValue('chaptersRead', currentRead + delta, {
      shouldDirty: true,
    });

    setChapters(
      chapters.map((chap) =>
        chap.id === chapter.id ? { ...chap, isRead: !originalRead } : chap,
      ),
    );
  };

  const delChapter = async (
    e: React.MouseEvent<HTMLButtonElement>,
    chapter: LiteratureChapter,
  ) => {
    e.stopPropagation();
    setOldChapters(chapters);
    const newChapters = chapters.filter((chap) => chap.id !== chapter.id);
    setChapters(newChapters);
  };

  const onSubmit: SubmitHandler<SerieEditForm> = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...data,
        chapters,
      };

      const response = await window.electronAPI.series.updateSerie(payload);

      if (!response?.success) {
        throw new Error(response?.error ?? 'Erro ao salvar a série');
      }

      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Erro ao atualizar série');
    } finally {
      setLoading(false);
    }
  };

  if (error) return <ErrorScreen error={error} serieName={serie_name} />;
  if (loading || !serie) return <Loading />;

  return (
    <article>
      <h1>
        Editando a série: <span> {serie.name}</span>
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className={styles['form-view']}>
        <div className={styles.card}>
          <div>
            <ImageController control={control} name={'coverImage'} />
          </div>
          <div className={styles.actionButtons}>
            <Favorite serie={serie} />
            <Rating serie={serie} />
            <CollectionButton dataPath={serie.dataPath} serieData={serie} />
          </div>
        </div>
        <div className={styles.mainInfo}>
          <div className={styles['text-info']}>
            <TextInput
              register={register('name', { required: true })}
              error={errors.name}
              msg="Nome da série"
            />
            <TextInput
              register={register('genre', { required: true })}
              error={errors.genre}
              msg={'Gênero da série'}
            />
            <TextInput
              register={register('author', { required: true })}
              error={errors.author}
              msg="Autor"
            />
            <TextInput
              register={register('language', { required: true })}
              error={errors.language}
              msg="Idioma"
            />
            <TextInput
              register={register('chaptersRead', { required: true })}
              error={errors.chaptersRead}
              msg={'Quantidade de capítulos lidos'}
            />
            <TagsField control={control} name={'tags'} />

            {serie.chapters && serie.chapters.length > 0 ? (
              <div className={styles.Control}>
                <h2>Capítulos</h2>

                <ul className={styles.chaptersList}>
                  {currentItems.map((chapter, idx) => (
                    <div key={chapter.id}>
                      <li
                        className={`${styles.chapter} ${
                          chapter.isRead ? styles.read : styles.unread
                        }`}
                      >
                        <span className={styles.chapterName}>
                          {chapter.name}
                        </span>

                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              isRead(e, chapter);
                            }}
                          >
                            {chapter.isRead ? (
                              <Eye size={26} strokeWidth={1} />
                            ) : (
                              <EyeOff size={26} strokeWidth={1} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => delChapter(e, chapter)}
                          >
                            <Trash />
                          </button>
                        </div>
                      </li>
                    </div>
                  ))}
                </ul>

                <div className={styles.ControlBtns} aria-label="Paginação">
                  <button
                    type="button"
                    className={styles.prevBTN}
                    onClick={() => handlePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-disabled={currentPage === 1}
                  >
                    <ChevronLeft />
                  </button>

                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handlePage(pageNumber)}
                      className={
                        pageNumber === currentPage
                          ? styles.active
                          : styles.disable
                      }
                      aria-current={
                        pageNumber === currentPage ? 'page' : undefined
                      }
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    className={styles.nextBTN}
                    type="button"
                    onClick={() => handlePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-disabled={currentPage === totalPages}
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>
            ) : (
              <></>
            )}

            <div className={styles['form-actions']}>
              <button type="button" onClick={() => navigate('/')}>
                Cancelar
              </button>
              <button type="reset" onClick={() => reset()}>
                Limpar
              </button>
              <button type="submit">Salvar</button>
            </div>
          </div>
          <div className={styles.checkInfo}>
            {/* Conversão entre tipos apenas no futuro */}
            {/* <LiteratureField
              name="literatureForm"
              register={register}
              error={errors.literatureForm}
            /> */}

            <BackupField
              register={register('metadata.autoBackup', { required: true })}
              error={errors.metadata?.autoBackup}
            />

            <StatusField
              register={register('metadata.status')}
              error={errors.metadata?.status}
            />

            <PrivacyField
              register={register('metadata.privacy', { required: true })}
              error={errors.metadata?.privacy}
            />

            <CollectionsField control={control} name="metadata.collections" />
          </div>
        </div>
      </form>
    </article>
  );
}
