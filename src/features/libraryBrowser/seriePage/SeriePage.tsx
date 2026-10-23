import { useParams } from 'react-router-dom';
import { LiteratureForm } from '@/shared/types/series.interfaces';
import useSerie from '@/shared/hooks/useSerie';
import useSerieStore from '@/shared/store/useSerieStore';
import Loading from '@/shared/components/Loading/Loading';
import ListLayout from '../components/ListLayout/ListLayout';

export default function SeriePage({
  literatureForm,
}: {
  literatureForm: LiteratureForm;
}) {
  const { serie_name = '' } = useParams<{ serie_name: string }>();
  useSerie(serie_name, literatureForm);
  const serie = useSerieStore((state) => state.serie);

  if (!serie || serie.name !== serie_name) return <Loading />;

  return <ListLayout serie={serie} />;
}
