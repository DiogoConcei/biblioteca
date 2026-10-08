import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useUploadStore } from '../store/uploadStore'; // Ajuste o caminho se necessário

export default function SerieUpload() {
  const navigate = useNavigate();
  const hasPendingItems = useUploadStore((state) => state.hasPendingItems);

  // 1. O PULO DO GATO: Pegamos a fila sincronamente no primeiro render.
  // Usamos useUploadStore.getState() em vez do hook para ler uma vez só,
  // sem atrelar nosso componente às futuras limpezas da store.
  const [initialData] = useState(() => useUploadStore.getState().pendingSeries);

  // 2. Chamamos os hooks INCONDICIONALMENTE (Regras dos hooks respeitadas!)
  const { form, currentIndex, fields, next, prev, submit, serverError, isSubmitting } =
    useSerieUploadForm(initialData);

  const {
    register,
    control,
    formState: { errors },
  } = form;

  // 3. Limpamos a fila global e lidamos com redirecionamento no useEffect
  useEffect(() => {
    // Consumimos a fila (limpando-a na store) para não deixar sujeira
    useUploadStore.getState().consumeSeries();

    // Se o initialData veio vazio (ex: usuário deu F5), manda de volta pra home
    if (initialData.length === 0) {
      navigate('/');
    }
  }, [initialData, navigate]);

  // 4. Retorno antecipado DEPOIS de todos os hooks! O React permite isso tranquilamente.
  if (initialData.length === 0 || isSubmitting === true) return <Loading />;

  // 5. Variáveis que dependem do índice
  const prefix = `series.${currentIndex}` as const;
  const serieErrors = errors.series?.[currentIndex];

  // (Opcional) Função para quando o submit der sucesso
  const handleSuccess = async (e: React.FormEvent) => {
    await submit(e); // Chama o submit do seu hook
    // Se não houver erros após o submit, direciona para o próximo passo
    if (hasPendingItems()) {
      navigate('/local-upload/chapter');
    } else {
      navigate('/');
    }
  };

  return (
    <article>
      <section className={styles['sec-form']}>
        <h1>
          Personalizando série ({currentIndex + 1}/{fields.length}):{' '}
          {fields[currentIndex]?.name || 'Nova Série'}
        </h1>

        <form className={styles['form-view']} onSubmit={handleSuccess}>
          <div key={fields[currentIndex]?.id} className={styles['form-view']}>
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
                <button type="submit" disabled={isSubmitting}>
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
