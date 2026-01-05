import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
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

/* Factory para criar um SerieData "vazio" que respeita a interface */
const createEmptySerieData = (): SerieData => ({
  name: '',
  sanitizedName: '',
  newPath: '',
  oldPath: '',
  chaptersPath: '',
  createdAt: '',
  deletedAt: '',
  collections: [],
});

export default function Upload() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialSeriesFromLocation =
    (location.state?.serieData as SerieData[]) ?? [];

  const [series, setSeries] = useState<SerieData[]>(
    initialSeriesFromLocation.length > 0
      ? initialSeriesFromLocation.map((s) => ({
          ...createEmptySerieData(),
          ...(s as any),
        }))
      : [createEmptySerieData()],
  );

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

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

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm<SerieForm>({
    defaultValues: emptyForm,
  });

  // useWatch para observar o form atual em tempo real
  const watchedForm = useWatch({ control }) as Partial<SerieForm> | undefined;

  // flag para evitar gravação enquanto resetamos o form ao trocar de série
  const isResettingRef = useRef<boolean>(false);

  // conversões
  const serieDataToForm = (s?: SerieData): SerieForm => {
    if (!s) return { ...emptyForm };
    return {
      name: s.name ?? '',
      sanitizedName: s.sanitizedName ?? '',
      genre: (s as any).genre ?? '',
      author: (s as any).author ?? '',
      cover_path: (s as any).cover_path ?? '',
      language: (s as any).language ?? '',
      privacy: (s as any).privacy ?? '',
      autoBackup: (s as any).autoBackup ?? '',
      readingStatus: (s as any).readingStatus ?? '',
      literatureForm: (s as any).literatureForm ?? '',
      tags: (s as any).tags ?? [],
      collections: s.collections ?? [],
      archivesPath: s.newPath ?? '',
      chaptersPath: s.chaptersPath ?? '',
      oldPath: s.oldPath ?? '',
      createdAt: s.createdAt ?? '',
      deletedAt: s.deletedAt ?? '',
    };
  };

  const formToSerieData = (
    f: Partial<SerieForm>,
    existing?: SerieData,
  ): SerieData => {
    // trata Partial<SerieForm> pois useWatch pode ser parcial
    const filled: SerieForm = {
      ...emptyForm,
      ...(f as SerieForm),
    };
    return {
      ...(existing ?? {}),
      name: filled.name,
      sanitizedName: filled.sanitizedName,
      newPath: filled.archivesPath ?? existing?.newPath ?? '',
      chaptersPath: filled.chaptersPath ?? existing?.chaptersPath ?? '',
      oldPath: filled.oldPath ?? existing?.oldPath ?? '',
      createdAt: filled.createdAt ?? existing?.createdAt ?? '',
      deletedAt: filled.deletedAt ?? existing?.deletedAt ?? '',
      collections: filled.collections ?? existing?.collections ?? [],
      // inclui demais campos do form (incluindo cover_path)
      ...(filled as any),
    } as SerieData;
  };

  // validação (tags e collections NÃO estão aqui)
  const REQUIRED_FIELDS: (keyof SerieForm)[] = [
    'name',
    'genre',
    'author',
    'language',
    'cover_path',
    'privacy',
    'autoBackup',
    'readingStatus',
    'literatureForm',
  ];

  const isValidForm = (serie: SerieForm): boolean =>
    REQUIRED_FIELDS.every((key) => {
      const value = serie[key];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      return value !== null && value !== undefined;
    });

  // agora que o state `series` é mantido em tempo real, basta validar o state completo
  const allSeriesValid = (): boolean => {
    const forms = series.map((s) => serieDataToForm(s));
    return forms.length > 0 && forms.every(isValidForm);
  };

  // --- quando currentIndex ou series mudar, resetamos o form com os dados da série corrente
  useEffect(() => {
    const serie = series[currentIndex];
    // sinaliza que vamos resetar (evita gravar via watcher)
    isResettingRef.current = true;
    reset(serieDataToForm(serie));
    // desativa a flag no próximo tick (deixa o watcher gravar normalmente depois do reset)
    Promise.resolve().then(() => {
      isResettingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, series]);

  // --- watcher: quando o form atual mudar, atualiza series[currentIndex] (persistência em tempo real)
  useEffect(() => {
    if (isResettingRef.current) return; // não grava enquanto resetamos
    if (!watchedForm) return;

    setSeries((prev) => {
      const copy = [...prev];
      copy[currentIndex] = formToSerieData(watchedForm, copy[currentIndex]);
      return copy;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedForm, currentIndex]);

  // salva dados do form atual no estado series (mantido, mas mantive função por compat)
  const saveCurrentFormToState = () => {
    const values = getValues();
    setSeries((prev) => {
      const copy = [...prev];
      copy[currentIndex] = formToSerieData(values, copy[currentIndex]);
      return copy;
    });
  };

  const handleNext = () => {
    saveCurrentFormToState();
    setCurrentIndex((i) => Math.min(i + 1, series.length - 1));
  };

  const handlePrev = () => {
    saveCurrentFormToState();
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const onSubmit = async (data: SerieForm) => {
    // garante estado atualizado (por precaução)
    saveCurrentFormToState();

    const finalSeries: SerieForm[] = series.map((s, idx) =>
      idx === currentIndex ? { ...data } : serieDataToForm(s),
    );

    if (!finalSeries.every(isValidForm)) {
      console.warn('Alguma série está incompleta');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Enviando:', finalSeries);
      await window.electronAPI.upload.uploadSeries(finalSeries);
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
        <span>
          <h1>
            Personalizando série ({currentIndex + 1}/{total}):{' '}
            {currentSerie?.name ?? '—'}
          </h1>
        </span>

        <form onSubmit={handleSubmit(onSubmit)} className={styles['form-view']}>
          <div className={styles['image-upload']}>
            <ImageController control={control} name="cover_path" />
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
                disabled={currentIndex === 0 || total === 0}
              >
                Anterior
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === total - 1 || total === 0}
              >
                Próximo
              </button>

              <button type="submit" disabled={!allSeriesValid()}>
                Salvar
              </button>
            </div>
          </div>
        </form>
      </section>
    </article>
  );
}
