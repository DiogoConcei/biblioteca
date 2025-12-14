// import { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import useSerie from '../../hooks/useSerie';
// import { useSerieStore } from '../../store/useSerieStore';
// import TextInput from '../../components/Form/GenericInputs/TextInput/TextInput';
// import LiteratureField from '../../components/Form/Fields/LiteratureField/LiteratureField';
// import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';
// import Loading from '../../components/Loading/Loading';
// import StatusField from '../../components/Form/Fields/StatusField/StatusField';
// import PrivacyField from '../../components/Form/Fields/PrivacyField/PrivacyField';
// import BackupField from '../../components/Form/Fields/BackupField/BackupField';
// import TagsField from '../../components/Form/Fields/TagsField/TagsField';
// import Favorite from '../../components/FavoriteButton/Favorite';
// import Rating from '../../components/Rating/Rating';
// import ImageController from '../../components/Form/Fields/ImageController/ImageController';
// import CollectionsField from '../../components/Form/Fields/CollectionsField/CollectionsField';
// import DownloadButton from '../../components/DonwloadButton/DownloadButton';
// import {
//   LiteratureChapter,
//   Literatures,
// } from '../../types/auxiliar.interfaces';
// import { SerieEditForm } from '../../types/series.interfaces';
// import styles from './SerieEdit.module.scss';

// export default function SerieEdit() {
//   const { serie_name: rawSerieName } = useParams<{ serie_name: string }>();
//   const serie_name = decodeURIComponent(rawSerieName ?? '');
//   const loading = useSerieStore((state) => state.loading);
//   const error = useSerieStore((state) => state.error);
//   const setError = useSerieStore((state) => state.setError);

//   const [serie, setSerie] = useState<Literatures | null>(null);
//   const { updateSerie } = useSerie('', '');
//   const navigate = useNavigate();

//   useEffect(() => {
//     async function fetchData() {
//       if (!serie_name) {
//         setError('O Nome da série não foi informado');
//         return;
//       }

//       const response = await window.electronAPI.series.getSerieData(serie_name);

//       if (!response.success || !response.data) {
//         setError('Falha na requisição');
//         return;
//       }

//       if (response.data) {
//         setSerie(response.data);
//       }
//     }

//     fetchData();
//   }, [serie_name]);

//   const {
//     control,
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors },
//   } = useForm<SerieEditForm>({
//     defaultValues: {
//       coverImage: '',
//       tags: [],
//     },
//     values: serie
//       ? {
//           name: serie.name,
//           sanitizedName: serie.sanitizedName,
//           genre: serie.genre,
//           author: serie.author,
//           language: serie.language,
//           coverImage: serie.coverImage
//             ? `data:image/webp;base64,${serie.coverImage}`
//             : '',
//           archivesPath: serie.archivesPath,
//           chaptersPath: serie.chaptersPath,
//           dataPath: serie.dataPath,
//           chapters: serie.chapters as LiteratureChapter[],
//           totalChapters: serie.totalChapters,
//           chaptersRead: serie.chaptersRead,
//           literatureForm: serie.literatureForm,
//           readingData: {
//             lastChapterId: serie.readingData.lastChapterId,
//             lastReadAt: serie.readingData.lastReadAt,
//           },
//           metadata: {
//             status: serie.metadata.status,
//             collections: serie.metadata.collections || [],
//             recommendedBy: serie.metadata.recommendedBy,
//             originalOwner: serie.metadata.originalOwner,
//             lastDownload: serie.metadata.lastDownload,
//             privacy: serie.metadata.privacy,
//             rating: serie.metadata.rating,
//             isFavorite: serie.metadata.isFavorite,
//             autoBackup: serie.metadata.autoBackup,
//           },
//           comments: serie.comments,
//           tags: serie.tags,
//           deletedAt: serie.deletedAt || '',
//           createdAt: serie.createdAt,
//         }
//       : undefined,
//   });

//   if (error) return <ErrorScreen error={error} serieName={serie_name} />;
//   if (loading || !serie) return <Loading />;

//   const onSubmit = () => {
//     console.log('Salvar série...');
//   };

//   return (
//     <article>
//       <section className="sec-form">
//         <span className="series-title">
//           <h1>Editando a série: {serie.name}</h1>
//           <form onSubmit={handleSubmit(onSubmit)}>
//             <div className={styles.header}>
//               <ImageController control={control} name="coverImage" />

//               <div className={styles.actionButtons}>
//                 <Favorite serie={serie} />
//                 <DownloadButton serie={serie} updateSerie={updateSerie} />
//                 <Rating serie={serie} />
//               </div>
//             </div>

//             <TextInput name="name" register={register} error={errors.name} />

//             <TextInput name="genre" register={register} error={errors.genre} />

//             <TextInput
//               name="author"
//               register={register}
//               error={errors.author}
//             />

//             <TextInput
//               name="language"
//               register={register}
//               error={errors.language}
//             />

//             <TextInput
//               name="chaptersRead"
//               register={register}
//               error={errors.chaptersRead}
//             />

//             <LiteratureField
//               register={register}
//               error={errors.literatureForm}
//               name=""
//             />

//             <StatusField
//               name=""
//               register={register}
//               error={errors.metadata?.status}
//             />

//             <PrivacyField
//               name=""
//               register={register}
//               error={errors.metadata?.privacy}
//             />

//             <BackupField
//               register={register}
//               error={errors.metadata?.autoBackup}
//               name=""
//             />

//             <TagsField control={control} name={'tags'} />

//             <CollectionsField control={control} name={'metadata.collections'} />
//           </form>
//         </span>
//       </section>
//     </article>
//   );
// }
