import './SerieConfig.scss';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSerieStore } from '../../store/useSerieStore';
import { Pencil, Trash } from 'lucide-react';
import Loading from '../../components/Loading/Loading';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';

export default function SerieConfig() {
  const series = useSerieStore((state) => state.series);
  const navigate = useNavigate();

  const resetStates = useSerieStore((state) => state.resetStates);

  const fetchAll = useSerieStore((state) => state.fetchSeries);
  const error = useSerieStore((state) => state.error);
  const loading = useSerieStore((state) => state.loading);

  useEffect(() => {
    const fetchData = async () => {
      await fetchAll();
    };
    fetchData();
  }, []);

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (loading || !series) {
    return <Loading />;
  }

  return (
    <section className="home">
      <div className="content">
        <div className="seriesContent">
          {series!.map((serie) => (
            <div className="serieCard" key={serie.id}>
              <figure className="coverCard">
                <img src={`${serie.coverImage}`} alt={`Série: ${serie.name}`} />
                <div className="cover-actions">
                  <button
                    className="deleteChapter"
                    aria-label={`Excluir série ${serie.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Delete...');
                    }}
                  >
                    <Trash size={'24'} />
                  </button>
                  <button
                    className="editChapter"
                    aria-label={`Editar série ${serie.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/edit/serie/${serie.name}`);
                    }}
                  >
                    <Pencil size={'24'} />
                  </button>
                </div>
              </figure>

              <div className="serie-info">
                <p className="serie-name">{serie.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
