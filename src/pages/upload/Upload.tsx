import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

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

  const initialSeriesFromLocation =
    (location.state?.serieData as SerieData[]) ?? [];

  const emptyForm: SerieForm = {
    name: '',
    sanitizedName: '',
    genre: '',
    author: '',
    cover_path: '',
    language: '',
    privacy: '',
    autoBackup: '',
    readingStatus: '',
    literatureForm: '' as SerieForm['literatureForm'],
    tags: [],
    collections: [],
    archivesPath: '',
    chaptersPath: '',
    oldPath: '',
    createdAt: '',
    deletedAt: '',
  };

  const [series, setSeries] = useState<SerieForm[]>(
    initialSeriesFromLocation.length > 0
      ? initialSeriesFromLocation.map((s) => ({
          ...emptyForm,
          ...(s as any),
        }))
      : [{ ...emptyForm }],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors, isValid },
  } = useForm<SerieForm>({
    defaultValues: emptyForm,
    mode: 'onChange',
  });

  useEffect(() => {
    reset(series[currentIndex]);
  }, [currentIndex, series, reset]);

  const saveCurrentForm = () => {
    const values = getValues();
    setSeries((prev) => {
      const copy = [...prev];
      copy[currentIndex] = values;
      return copy;
    });
  };

  const handleNext = () => {
    const values = getValues();

    setSeries((prev) => {
      const copy = [...prev];
      copy[currentIndex] = values;

      const nextIndex = Math.min(currentIndex + 1, copy.length - 1);
      setCurrentIndex(nextIndex);

      return copy;
    });
  };

  const handlePrev = () => {
    saveCurrentForm();
    const values = getValues();
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const onSubmit = async (data: SerieForm) => {
    saveCurrentForm();

    // validação final: todas as séries precisam estar completas
    const hasInvalidSerie = series.some(
      (s) =>
        !s.name ||
        !s.genre ||
        !s.author ||
        !s.language ||
        !s.cover_path ||
        !s.privacy ||
        !s.autoBackup ||
        !s.readingStatus ||
        !s.literatureForm,
    );

    if (hasInvalidSerie) {
      console.warn('Alguma série está incompleta');
      return;
    }

    setIsLoading(true);
    try {
      await window.electronAPI.upload.uploadSeries(series);
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  const total = series.length;
  const currentSerie = series[currentIndex];

  return (
    <article>
      <section className={styles['sec-form']}>
        <h1>
          Personalizando série ({currentIndex + 1}/{total}):{' '}
          {currentSerie?.name || '—'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className={styles['form-view']}>
          <div className={styles['image-upload']}>
            <ImageController control={control} name="cover_path" />
          </div>

          <div className={styles['form-container']}>
            <div className={styles['text-info']}>
              <TextInput
                register={register('name', { required: true })}
                error={errors.name}
                msg="Nome da série"
              />
              <TextInput
                register={register('genre', { required: true })}
                error={errors.genre}
                msg="Gênero da série"
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
            </div>

            <LiteratureField
              register={register('literatureForm', { required: true })}
              error={errors.literatureForm}
            />

            <TagsField control={control} name="tags" />

            <BackupField
              register={register('autoBackup', { required: true })}
              error={errors.autoBackup}
            />

            <PrivacyField
              register={register('privacy', { required: true })}
              error={errors.privacy}
            />

            <StatusField
              register={register('readingStatus', { required: true })}
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
                disabled={currentIndex === total - 1}
              >
                Próximo
              </button>

              <button type="submit" disabled={!isValid}>
                Salvar
              </button>
            </div>
          </div>
        </form>
      </section>
    </article>
  );
}
