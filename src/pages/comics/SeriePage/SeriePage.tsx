import { useParams } from "react-router-dom";
import { Comic, ComicCollectionInfo } from "../../../types/comic.interfaces";
import { useState, useEffect } from "react";
import ChaptersInfo from "../../../components/ChaptersInfo/ChaptersInfo";
import ComicActions from "../../../components/ComicActions/ComicActions";
import "./SeriePage.css";

export default function SeriePage() {
  const [serie, setSerie] = useState<Comic | null>(null);
  const [collectionInfo, setCollectionInfo] = useState<
    ComicCollectionInfo[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const { book_name } = useParams();

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        const data = await window.electron.series.getSerie(book_name);
        const favSeries = await window.electron.series.getFavSeries();
        setSerie(data);
        setCollectionInfo(favSeries);
      } catch (error) {
        console.error("Erro ao carregar série:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getData();
  }, []);

  if (!serie || !collectionInfo) {
    return <p>Carrengado dados...</p>;
  }

  return (
    <section className="serieHeader">
      <div className="archivesInfo">
        <figure>
          <img
            className="serieCover"
            src={`data:image/png;base64,${serie.cover_image}`}
            alt={`Capa do quadrinho ${serie.name}`}
          />
        </figure>
        <h2 className="owner">Upload por: {serie.metadata.original_owner}</h2>
        <h2 className="recomend">
          recomendada por: {serie.metadata.recommended_by}
        </h2>
      </div>
      <section className="mainContent">
        <h2>{serie.name}</h2>
        <div className="serieMetadata">
          <p>Status: {serie.metadata.status}</p>
          <p>Capítulos lidos: {serie.chapters_read}</p>
          <p>Quantidade de capítulos: {serie.total_chapters}</p>
          <p>Criado em: {serie.created_at}</p>
          <p>Último capítulo lido: {serie.reading_data.last_chapter_id}</p>
        </div>
        <div className="serieActions">
          <ComicActions serie={serie} setSerie={setSerie} />
        </div>
        <section className="serieChapters">
          <ChaptersInfo serie={serie} />
        </section>
      </section>
      <aside className="seriesInfo">
        <section className="favorites">
          <h3>Séries Favoritas</h3>
          <ul className="fav-series">
            {collectionInfo.map((serie) => (
              <li key={serie.id}>{serie.name}</li>
            ))}
          </ul>
        </section>
        <section className="recent">
          <h3>Últimas séries lidas</h3>
          <ul className="recent-series">
            <li>teste 1</li>
            <li>teste 2</li>
            <li>teste 3</li>
            <li>teste 4</li>
            <li>teste 5</li>
          </ul>
        </section>
      </aside>
    </section>
  );
}
