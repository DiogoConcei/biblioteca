import ImageController from '@/features/upload/components/ImageController/ImageController';
import LiteratureField from '@/features/upload/components/LiteratureField/LiteratureField';
import TextInput from '@/shared/components/TextInput/TextInput';
import BackupField from '@/features/upload/components/BackupField/BackupField';
import PrivacyField from '@/features/upload/components/PrivacyField/PrivacyField';
import StatusField from '@/features/upload/components/StatusField/StatusField';
import CollectionsField from '@/features/upload/components/CollectionsField/CollectionsField';
import TagsField from '@/features/upload/components/TagsField/TagsField';
import Loading from '../../../shared/components/Loading/Loading';
import styles from './SerieUpload.module.scss';
import { useSerieUploadForm } from '@/features/upload/hooks/useSerieUploadForm';
import { SerieData } from '@/shared/types/series.interfaces';
import { useLocation } from 'react-router-dom';

export default function SerieUpload() {
  const location = useLocation();
  const initial: SerieData[] = location.state.SerieData;
  const { form, currentIndex, fields } = useSerieUploadForm(initial);

  return (
    <>
      <p>alou</p>
    </>
  );
}
