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
  const initial: SerieData[] = location.state?.SerieData ?? [];
  const { form, currentIndex, fields } = useSerieUploadForm(initial);
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
          {fields[currentIndex].name}
        </h1>

        <div key={fields[currentIndex].id}>
          <div className={styles['image-upload']}>
            <ImageController control={control} name={`${prefix}.cover_path`} />
          </div>

          <div>
            <TextInput
              register={register(`${prefix}.name`)}
              error={serieErrors?.name}
              msg="Nome da série"
            />

            {/* Genero */}
            {/* <TextInput
              register={register(`${prefix}.name`)}
              error={serieErrors?.name}
              msg="Nome da série"
            /> */}

            {/* Autor */}
            {/* <TextInput
              register={register(`${prefix}.name`)}
              error={serieErrors?.name}
              msg="Nome da série"
            /> */}

            {/* Idioma atual */}
            {/* <TextInput
              register={register(`${prefix}.name`)}
              error={serieErrors?.name}
              msg="Nome da série"
            />
 */}
          </div>
          <LiteratureField
            register={register(`${prefix}.literatureForm`)}
            error={serieErrors?.literatureForm}
          />
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

          <TagsField control={control} name={`${prefix}.tags`} />

          <div className={styles['navigation-buttons']}>
            <button type="button">Anterior</button>
            <button type="button">Próximo</button>
            <button type="submit">Salvar</button>
          </div>
        </div>
      </section>
    </article>
  );
}
