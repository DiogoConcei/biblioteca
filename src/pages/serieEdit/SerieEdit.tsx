import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { ImagePlus } from 'lucide-react';
import { useSerieStore } from '../../store/seriesStore';
import TextInput from '../../components/Form/GenericInputs/TextInput/TextInput';
import LiteratureField from '../../components/Form/Fields/LiteratureField/LiteratureField';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
import Loading from '../../components/Loading/Loading';
import StatusField from '../../components/Form/Fields/StatusField/StatusField';
import PrivacyField from '../../components/Form/Fields/PrivacyField/PrivacyField';
import BackupField from '../../components/Form/Fields/BackupField/BackupField';
import TagsField from '../../components/Form/Fields/TagsField/TagsField';
import Favorite from '../../components/FavoriteButton/Favorite';
import Rating from '../../components/Rating/Rating';
import CollectionsField from '../../components/Form/Fields/CollectionsField/CollectionsField';
import {
  LiteratureChapter,
  Literatures,
} from '../../types/auxiliar.interfaces';
import { SerieEditForm } from '../../types/series.interfaces';
import './SerieEdit.scss';

export default function SerieEdit() {
  const { serie_name: rawSerieName } = useParams<{ serie_name: string }>();
  const serie_name = decodeURIComponent(rawSerieName ?? '');
  const loading = useSerieStore((state) => state.loading);
  const error = useSerieStore((state) => state.error);
  const setError = useSerieStore((state) => state.setError);

  const [serie, setSerie] = useState<Literatures | null>(null);
  const [preview, setPreview] = useState<string>();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      if (!serie_name) {
        setError('O Nome da série não foi informado');
        return;
      }

      const response = await window.electronAPI.series.getSerieData(serie_name);

      if (!response.success || !response.data) {
        setError('Falha na requisição');
        return;
      }

      if (response.data) {
        setSerie(response.data);
      }
    }

    fetchData();
  }, [serie_name]);

  const {
    control,
    register,
    handleSubmit,
    setValue,
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
          coverImage: serie.coverImage
            ? `data:image/webp;base64,${serie.coverImage}`
            : '',
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

  if (error) return <ErrorScreen error={error} serieName={serie_name} />;
  if (loading || !serie) return <Loading />;

  const onSubmit = () => {
    console.log('Salvar série...');
  };

  return (
    <article>
      <section className="sec-form">
        <span className="series-title">
          <h1>Editando a série: {serie.name}</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="coverImage"
              control={control}
              rules={{ required: 'A capa é obrigatória' }}
              render={({ field, fieldState }) => (
                <div className="image-upload">
                  <span>Capa</span>
                  <div
                    className="image-container"
                    onClick={() =>
                      document.getElementById('coverInput')?.click()
                    }
                  >
                    {preview || field.value ? (
                      <img
                        src={preview || field.value}
                        alt="Preview da capa"
                        className="cover-preview"
                      />
                    ) : (
                      <span className="alert">
                        <ImagePlus color="#8963ba" />
                      </span>
                    )}

                    <input
                      id="coverInput"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setPreview(reader.result as string);
                        reader.readAsDataURL(file);

                        const path =
                          await window.electronAPI.webUtilities.getPathForFile(
                            file,
                          );
                        field.onChange(path);
                      }}
                    />
                  </div>

                  {fieldState.error && (
                    <p className="error">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <TextInput
              label="name"
              name="name"
              register={register}
              error={errors.name}
            />

            <TextInput
              label="Genero"
              name="genre"
              register={register}
              error={errors.genre}
            />

            <TextInput
              label="Autor"
              name="author"
              register={register}
              error={errors.author}
            />

            <TextInput
              label="Idioma"
              name="language"
              register={register}
              error={errors.language}
            />

            <TextInput
              label="Quantidade de capítulos lidos"
              name="chaptersRead"
              register={register}
              error={errors.chaptersRead}
            />

            <LiteratureField
              register={register}
              error={errors.literatureForm}
              label=""
              name=""
            />

            <StatusField
              label=""
              name=""
              register={register}
              error={errors.metadata?.status}
            />

            <PrivacyField
              label=""
              name=""
              register={register}
              error={errors.metadata?.privacy}
            />

            <BackupField
              register={register}
              error={errors.metadata?.autoBackup}
              label=""
              name=""
            />

            <TagsField control={control} />

            <Favorite serie={serie} />

            <Rating serie={serie} />

            <CollectionsField control={control} />

            {/* 
            <Controller
              name="comments"
              defaultValue={serie.comments}
              control={control}
              render={({ field, fieldState }) => (
                <label>
                  Comentários
                  <input type="text" {...field} />
                </label>
              )}
            /> */}
          </form>
        </span>
      </section>
    </article>
  );
}
