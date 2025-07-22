import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Comic, ComicEdition } from "../../../electron/types/comic.interfaces";
import useSerie from "../../hooks/useSerie";
import { useSerieStore } from "../../store/seriesStore";
import ErrorScreen from "../../components/ErrorScreen/ErrorScreen";
import useCollection from "../../hooks/useCollection";
import useAction from "../../hooks/useAction";
import useDownload from "../../hooks/useDownload";
import "./ComicPage.scss";
import { ArrowDownToLine, ArrowDownFromLine, LoaderCircle } from "lucide-react";

type DownloadStatus = "not_downloaded" | "downloading" | "downloaded";

export default function ComicPage() {
  const { comic_name } = useParams<{ comic_name: string }>();
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [downloadStatus, setDownloadStatus] = useState<
    Record<number, DownloadStatus>
  >({});
  const [error, setError] = useState<string | null>(null);

  const { downloadIndividual } = useDownload({
    setError,
    setDownloaded,
    setDownloadStatus,
  });

  const { serie: rawSerie, updateChapter } = useSerie(comic_name!, "Quadrinho");
  const serie = rawSerie as Comic;

  const loading = useSerieStore((state) => state.loading);
  const { favorites } = useCollection();

  const { openChapter } = useAction(serie?.dataPath || "");

  const orderFav = useMemo(() => {
    return favorites
      ? [...favorites.series].sort((a, b) => b.rating - a.rating)
      : [];
  }, [favorites]);

  if (error) {
    return <ErrorScreen error={error} serieName={comic_name!} />;
  }

  if (loading || !serie) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <section className="comicGrid">
      {serie.chapters!.map((edition) => (
        <div
          key={edition.id}
          className={`comicCard ${edition.isRead ? "read" : ""}`}
          onClick={(e) => openChapter(e, serie, edition, downloadIndividual)}
        >
          <div className="ribbon">{edition.isRead ? "Lido" : "Não Lido"}</div>
          <img
            className="cover"
            src={`data:image/webp;base64,${edition.coverPath}`}
            alt={edition.name}
          />

          <div className="infoOverlay">
            <p className="title">{edition.name}</p>
            <button
              className="downloadButton"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                downloadIndividual(
                  serie.dataPath,
                  edition.id,
                  edition,
                  updateChapter,
                  event
                )
              }
            >
              {downloadStatus[edition.id] === "downloading" ? (
                <LoaderCircle
                  size={24}
                  strokeWidth={1}
                  className="animate-spin"
                />
              ) : edition.isDownload ||
                downloadStatus[edition.id] === "downloaded" ? (
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
