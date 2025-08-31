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
import './Upload.scss';

export default function Upload() {
  const location = useLocation();
  const navigate = useNavigate();
  const [newSeries, setNewSeries] = useState<SerieData[]>(() => {
    return (location.state?.serieData as SerieData[]) || [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (location.state?.newSeries) {
      setNewSeries(location.state.newSeries as SerieData[]);
      setCurrentIndex(0);
    }
  }, [location.state?.newSeries]);

  const {
    register,
    handleSubmit,
    reset,
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
      navigate('/');
    } else {
      setIsLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };
  const handleNext = () => {
    if (currentIndex < newSeries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <article>
      <section className="sec-form">
        {newSeries.length > 0 && (
          <span className="series-title">
            <h1>Personalizando série: {newSeries[currentIndex].name}</h1>
          </span>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="form-view">
          <div className="image-upload">
            <span>Capa de exibição</span>

            <ImageController control={control} name={'cover_path'} />
          </div>

          <div className="form-container">
            <div className="text-info">
              {/* Label de nome da série */}
              <TextInput name="name" register={register} error={errors.name} />

              {/* Label de genêro da série */}
              <TextInput
                name="genre"
                register={register}
                error={errors.genre}
              />

              {/* Label de autor da série */}
              <TextInput
                name="author"
                register={register}
                error={errors.author}
              />

              {/* Label de idioma da série */}
              <TextInput
                name="language"
                register={register}
                error={errors.language}
              />
            </div>

            {/* Label de LiteratureForm da série */}
            <LiteratureField
              name="literatureForm"
              register={register}
              error={errors.literatureForm}
            />

            <TagsField control={control} name="tags" />

            {/* Label de autoBackup da série */}
            <BackupField
              name="autoBackup"
              register={register}
              error={errors.autoBackup}
            />

            {/* Label de Privacy da série */}
            <PrivacyField
              name="privacy"
              register={register}
              error={errors.privacy}
            />

            {/* Label de Status da série */}
            <StatusField
              name="readingStatus"
              register={register}
              error={errors.readingStatus}
            />

            <CollectionsField control={control} name="collections" />

            <div className="navigation-buttons">
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

// if (response.success && currentIndex < newSeries.length) {
//     setIsLoading(false);
//     navigate('/');
//   }

//   if (response.success) {
//     setIsLoading(false);
//     setCurrentIndex((prev) => prev + 1);
//   }
