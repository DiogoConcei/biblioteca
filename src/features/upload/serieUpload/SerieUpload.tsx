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
import { useSerieUploadForm } from '@/features/upload/hooks/useSerieUploadForm';
import { SerieData } from '@/shared/types/series.interfaces';
import { useLocation } from 'react-router-dom';

export default function SerieUpload() {
  const location = useLocation();
  const initial: SerieData[] = location.state?.serieData ?? [];
  const { form, currentIndex, fields, next, prev, submit, serverError, isSubmitting } =
    useSerieUploadForm(initial);
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const prefix = `series.${currentIndex}` as const;
  const serieErrors = errors.series?.[currentIndex];

  return (
    <article>
      <section className={styles['sec-form']}>
        <h1>
          Personalizando série ({currentIndex + 1}/{fields.length}):{' '}
          {fields[currentIndex].name || 'Nova Série'}
        </h1>

        <form className={styles['form-view']} onSubmit={submit}>
          <div key={fields[currentIndex].id} className={styles['form-view']}>
            <div className={styles['image-upload']}>
              <ImageController control={control} name={`${prefix}.cover_path`} />
            </div>

            <div className={styles['form-container']}>
              <div className={styles['text-info']}>
                <TextInput
                  register={register(`${prefix}.name`)}
                  error={serieErrors?.name}
                  msg="Nome da série"
                />
                <TextInput
                  register={register(`${prefix}.genre`)}
                  error={serieErrors?.genre}
                  msg="Gênero da série"
                />
                <TextInput
                  register={register(`${prefix}.author`)}
                  error={serieErrors?.author}
                  msg="Autor"
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

              <div className={styles['navigation-buttons']}>
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
                {serverError && <p className={styles.error}>{serverError}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => {
                    console.log('Clicou');
                  }}
                >
                  {isSubmitting ? 'Enviando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>
    </article>
  );
}
