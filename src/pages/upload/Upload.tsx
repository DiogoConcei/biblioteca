import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import ImageController from '../../components/Form/Fields/ImageController/ImageController';
import TextInput from '../../components/Form/GenericInputs/TextInput/TextInput';
import LiteratureField from '../../components/Form/Fields/LiteratureField/LiteratureField';
import BackupField from '../../components/Form/Fields/BackupField/BackupField';
import PrivacyField from '../../components/Form/Fields/PrivacyField/PrivacyField';
import StatusField from '../../components/Form/Fields/StatusField/StatusField';
import CollectionsField from '../../components/Form/Fields/CollectionsField/CollectionsField';
import TagsField from '../../components/Form/Fields/TagsField/TagsField';
import Loading from '../../components/Loading/Loading';
import { SerieData, SerieForm } from '../../types/series.interfaces';
import styles from './Upload.module.scss';

export default function Upload() {
  const location = useLocation();
  const navigate = useNavigate();
  const [newSeries, setNewSeries] = useState<SerieData[]>(() => {
    return (location.state?.serieData as SerieData[]) || [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm<SerieForm>({
    defaultValues: {
      name: newSeries[currentIndex].name,
      sanitizedName: newSeries[currentIndex].sanitizedName,
      genre: '',
      author: '',
      cover_path: '',
      language: '',
      privacy: '',
      autoBackup: '',
      readingStatus: '',
      literatureForm: '',
      tags: [],
      collections: [],
      archivesPath: newSeries[currentIndex].newPath,
      chaptersPath: newSeries[currentIndex].chaptersPath,
      oldPath: newSeries[currentIndex].oldPath,
      createdAt: newSeries[currentIndex].createdAt,
      deletedAt: newSeries[currentIndex].deletedAt,
    },
  });

  const onSubmit: SubmitHandler<SerieForm> = async (data: SerieForm) => {
    setIsLoading(true);
    const response = await window.electronAPI.upload.uploadSerie(data);

    if (response.success) {
      setIsLoading(false);
      setCurrentIndex((prev) => prev + 1);
      reset();
    } else {
      setIsLoading(false);
    }

    if (currentIndex === newSeries.length - 1) {
      navigate('/');
    }
  };

  const formManager = () => {
    const formData = getValues();

    setNewSeries((prev) => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        ...formData,
      };
      return updated;
    });
  };

  const handleNext = () => {
    if (currentIndex >= newSeries.length - 1) return;

    formManager();
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex <= 0) return;

    formManager();
    setCurrentIndex((prev) => prev - 1);
  };

  if (isLoading) {
    return <Loading />;
  }

  useEffect(() => {
    if (!newSeries[currentIndex]) return;

    reset({
      ...newSeries[currentIndex],
    });
  }, [currentIndex, newSeries, reset]);

  return (
    <article>
      <section className={styles['sec-form']}>
        {newSeries.length > 0 && (
          <span>
            <h1>Personalizando série: {newSeries[currentIndex].name}</h1>
          </span>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={styles['form-view']}>
          <div className={styles['image-upload']}>
            <ImageController control={control} name={'cover_path'} />
          </div>

          <div className={styles['form-container']}>
            <div className={styles['text-info']}>
              <TextInput
                name="name"
                register={register}
                error={errors.name}
                msg={'Nome da série'}
              />

              <TextInput
                name="genre"
                register={register}
                error={errors.genre}
                msg={'Gênero da série'}
              />

              <TextInput
                name="author"
                register={register}
                error={errors.author}
                msg={'Autor'}
              />

              <TextInput
                name="language"
                register={register}
                error={errors.language}
                msg={'Idioma'}
              />
            </div>

            <LiteratureField
              name="literatureForm"
              register={register}
              error={errors.literatureForm}
            />

            <TagsField control={control} name="tags" />

            <BackupField
              name="autoBackup"
              register={register}
              error={errors.autoBackup}
            />

            <PrivacyField
              name="privacy"
              register={register}
              error={errors.privacy}
            />

            <StatusField
              name="readingStatus"
              register={register}
              error={errors.readingStatus}
            />

            <CollectionsField control={control} name="collections" />

            <div className={styles['navigation-buttons']}>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === newSeries.length - 1}
              >
                Próximo
              </button>
              <button type="submit">Salvar</button>
            </div>
          </div>
        </form>
      </section>
    </article>
  );
}
