import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller } from 'react-hook-form';
import ImageController from '@/features/upload/components/ImageController/ImageController';
import LiteratureField from '@/features/upload/components/LiteratureField/LiteratureField';
import TextInput from '@/shared/components/TextInput/TextInput';
import BackupField from '@/features/upload/components/BackupField/BackupField';
import PrivacyField from '@/features/upload/components/PrivacyField/PrivacyField';
import StatusField from '@/features/upload/components/StatusField/StatusField';
import CollectionsField from '@/features/upload/components/CollectionsField/CollectionsField';
import TagsField from '@/features/upload/components/TagsField/TagsField';
import Loading from '@/shared/components/Loading/Loading';
import styles from './SerieUpload.module.scss';
import { useAllSeriesStore } from '@/shared/store/useAllSeriesStore';
import { useSerieUploadForm } from '@/features/upload/hooks/useSerieUploadForm';
import { useUploadStore } from '../store/uploadStore';
import BackgroundField from '@/features/upload/components/BackgroundField/BackgroundField';
import ErrorScreen from '@/shared/components/ErrorScreen/ErrorScreen';
import { useUIStore } from '@/shared/store/useUIStore';
import ViewModeSelector from '@/shared/components/ViewModeSelector/ViewModeSelector';
import MetadataViewer from '@/features/upload/components/MetadataViewer/MetadataViewer';
import { ScrapedMetadata } from '@/shared/types/collections.interfaces';
import { Globe } from 'lucide-react';

export default function SerieUpload() {
  const navigate = useNavigate();
  const error = useUIStore((s) => s.error);
  const [initialData] = useState(() => useUploadStore.getState().pendingSeries);

  // Estado para controlar o modal de "Rede"
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);

  const { form, currentIndex, fields, next, prev, submit, serverError, isSubmitting } =
    useSerieUploadForm(initialData, {
      onSuccess: () => {
        const store = useUploadStore.getState();
        store.consumeSeries();
        void window.electronAPI.upload.clearSuggestedCovers();
        useAllSeriesStore.getState().fetchAllSeries();
        navigate(store.pendingChapters.length > 0 ? '/local-upload/chapter' : '/');
      },
    });
  const {
    register,
    control,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (initialData.length === 0) {
      navigate('/');
    }
  }, [initialData, navigate]);

  useEffect(() => {
    return () => {
      useUploadStore.getState().consumeSeries();
      void window.electronAPI.upload.clearSuggestedCovers();
    };
  }, []);

  const handleApplyMetadata = (meta: ScrapedMetadata) => {
    const opts = { shouldDirty: true, shouldValidate: true };

    form.setValue(`${prefix}.name`, meta.title, opts);
    if (meta.authors?.length)
      form.setValue(`${prefix}.author`, meta.authors.join(', '), opts);
    if (meta.genres?.length)
      form.setValue(`${prefix}.genre`, meta.genres.join(', '), opts);
    if (meta.coverUrl) form.setValue(`${prefix}.cover_path`, meta.coverUrl, opts);
    if (meta.description) form.setValue(`${prefix}.description`, meta.description, opts);
  };

  if (error) return <ErrorScreen error={error} />;
  if (initialData.length === 0 || isSubmitting === true) return <Loading />;

  const prefix = `series.${currentIndex}` as const;
  const backgroundImage = form.watch(`${prefix}.backgroundImage`);
  const literatureForm = form.watch(`${prefix}.literatureForm`);
  const serieErrors = errors.series?.[currentIndex];

  const pageStyle = backgroundImage
    ? {
        backgroundImage: `radial-gradient(circle, rgba(40, 44, 52, 0.3) 0%, rgba(40, 44, 52, 0.85) 100%), url("${backgroundImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.3s ease-in-out',
      }
    : {};

  return (
    <article className={styles.page} style={pageStyle}>
      <h1 className={styles.title}>
        Personalizando série ({currentIndex + 1}/{fields.length}):{' '}
        {fields[currentIndex]?.name || 'Nova Série'}
      </h1>

      <form className={styles.form} onSubmit={submit}>
        <div key={fields[currentIndex]?.id} className={styles.columns}>
          <div className={styles.column}>
            <ImageController
              control={control}
              name={`${prefix}.cover_path`}
              sourcePath={fields[currentIndex].oldPath}
              type={literatureForm}
            />
          </div>

          {/* Coluna 2: informações */}
          <div className={styles.column}>
            <div className={styles['fields-grid']}>
              <TextInput
                register={register(`${prefix}.name`)}
                error={serieErrors?.name}
                msg="Nome da série"
              />
              <TextInput
                register={register(`${prefix}.author`)}
                error={serieErrors?.author}
                msg="Autor"
              />
              <TextInput
                register={register(`${prefix}.genre`)}
                error={serieErrors?.genre}
                msg="Gênero da série"
              />
              <TextInput
                register={register(`${prefix}.language`)}
                error={serieErrors?.language}
                msg="Idioma"
              />
            </div>

            <LiteratureField
              register={register(`${prefix}.literatureForm`)}
              error={serieErrors?.literatureForm}
            />

            <textarea
              {...register(`${prefix}.description`)}
              className={styles.description}
              aria-label="Descrição"
              placeholder="Sinopse, anotações..."
            />

            <Controller
              control={control}
              name={`${prefix}.backgroundImage`}
              render={({ field }) => (
                <BackgroundField value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          </div>

          <div className={styles.column}>
            <TagsField control={control} name={`${prefix}.tags`} />
            <BackupField
              register={register(`${prefix}.autoBackup`)}
              error={serieErrors?.autoBackup}
            />
            <PrivacyField
              register={register(`${prefix}.privacy`)}
              error={serieErrors?.privacy}
            />
            <StatusField
              register={register(`${prefix}.readingStatus`)}
              error={serieErrors?.readingStatus}
            />
            <CollectionsField control={control} name={`${prefix}.collections`} />

            <Controller
              control={control}
              name={`${prefix}.viewMode`}
              render={({ field }) => (
                <ViewModeSelector value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>

        <footer className={styles.footer}>
          <div className={styles['footer-group']}>
            <button type="button" disabled={currentIndex === 0} onClick={prev}>
              Anterior
            </button>
            <button
              type="button"
              disabled={currentIndex === fields.length - 1}
              onClick={next}
            >
              Próximo
            </button>
          </div>

          {serverError && <p className={styles.error}>{serverError}</p>}

          <div className={styles['footer-group']}>
            <button
              type="button"
              onClick={() => setIsNetworkModalOpen(true)}
              className={styles['btn-network']}
              title="Buscar metadados na rede"
            >
              <Globe size={20} />
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Salvar'}
            </button>
          </div>
        </footer>
      </form>

      {isNetworkModalOpen && (
        <MetadataViewer
          onClose={() => setIsNetworkModalOpen(false)}
          onSelect={handleApplyMetadata}
        />
      )}
    </article>
  );
}
