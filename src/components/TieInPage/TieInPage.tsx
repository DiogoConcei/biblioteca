import { TieIn } from 'electron/types/comic.interfaces';
import { DownloadStatus } from '../../types/auxiliar.interfaces';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowDownFromLine, LoaderCircle } from 'lucide-react';
import useAction from '../../hooks/useAction';
import useDownload from '../../hooks/useDownload';
import useSerie from '../../hooks/useSerie';
import ErrorScreen from '../ErrorScreen/ErrorScreen';
import Loading from '../Loading/Loading';

export default function TieInPage() {
  const [tieIn, setTieIn] = useState<TieIn | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<
    Record<number, DownloadStatus>
  >({});

  const { openChapter } = useAction(tieIn?.dataPath || '');
  const { downloadIndividual } = useDownload({ setError, setDownloadStatus });

  const { tiein_name: rawChapterName } = useParams<{ tiein_name: string }>();
  const tiein_name = decodeURIComponent(rawChapterName!);
  const { updateChapter } = useSerie(tiein_name);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await window.electronAPI.series.getTieIn(tiein_name!);

        if (!response.success || !response.data) {
          setError('Falha ao carregar dados do tie-in.');
          setTieIn(null);
          return;
        }

        setTieIn(response.data);
      } catch (e) {
        setError('Erro na requisição');
        setTieIn(null);
      }
    };

    fetchData();
  }, [tiein_name]);

  if (!tiein_name) {
    return (
      <ErrorScreen
        error="Não foi encontrado o nome da série."
        serieName="Desconhecido"
      />
    );
  }

  if (error) {
    return <ErrorScreen error={error} serieName={tiein_name} />;
  }

  if (isLoading || !tieIn || !tieIn.chapters) {
    return <Loading />;
  }

  return (
    <section className="comicGrid">
      {tieIn.chapters!.map((edition) => (
        <div
          key={edition.id}
          className={`comicCard ${edition.isRead ? 'read' : ''}`}
          onClick={(e) => openChapter(e, tieIn, edition, downloadIndividual)}
        >
          <div className="ribbon">{edition.isRead ? 'Lido' : 'Não Lido'}</div>
          <img
            className="cover"
            src={`data:image/webp;base64,${edition.coverPath}`}
            alt={edition.name}
          />

          <div className="infoOverlay">
            <p className="title">{edition.name}</p>
            <button
              className="downloadButton"
              onClick={(event) => {
                event.stopPropagation();
                downloadIndividual(
                  tieIn.dataPath,
                  edition.id,
                  edition,
                  updateChapter,
                  event,
                );
              }}
            >
              {downloadStatus[edition.id] === 'downloading' ? (
                <LoaderCircle
                  size={24}
                  strokeWidth={1}
                  className="animate-spin"
                />
              ) : edition.isDownload ||
                downloadStatus[edition.id] === 'downloaded' ? (
                <ArrowDownFromLine size={24} color="#8963ba" strokeWidth={1} />
              ) : (
                <ArrowDownToLine size={24} color="#aa5042" strokeWidth={1} />
              )}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
