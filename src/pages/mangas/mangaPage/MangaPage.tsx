import { useParams } from "react-router-dom";
import { Manga } from "..//../../types/manga.interfaces";
import { Collection } from "../../../types/collections.interfaces";
import { useState, useEffect } from "react";
import ChaptersInfo from "../../../components/ChaptersInfo/ChaptersInfo";
import SerieActions from "../../../components/SerieActions/SerieActions";
import "./MangaPage.css";

export default function MangaPage() {
  const [manga, setManga] = useState<Manga | null>(null);
  const [favCollection, setfavCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { manga_name } = useParams();

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        const data = await window.electron.series.getManga(manga_name);
        const favSeries = await window.electron.collections.getFavSeries();
        setManga(data);
        setfavCollection(favSeries);
      } catch (error) {
        console.error("Erro ao carregar série:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    getData();
  }, []);

  if (isLoading) {
    return <p>Carrengado dados...</p>;
  }

  return (
    <section className="serieHeader">
      <div className="archivesInfo">
        <figure>
          <img
            className="serieCover"
            src={`data:image/png;base64,${manga.cover_image}`}
            alt={`Capa do quadrinho ${manga.name}`}
          />
        </figure>
        <h2 className="owner">Upload por: {manga.metadata.original_owner}</h2>
        <h2 className="recomend">
          recomendada por: {manga.metadata.recommended_by}
        </h2>
      </div>
      <section className="mainContent">
        <h2>{manga.name}</h2>
        <div className="serieMetadata">
          <p>Status: {manga.metadata.status}</p>
          <p>Capítulos lidos: {manga.chapters_read}</p>
          <p>Quantidade de capítulos: {manga.total_chapters}</p>
          <p>Criado em: {manga.created_at}</p>
          <p>Último capítulo lido: {manga.reading_data.last_chapter_id}</p>
        </div>
        <div className="serieActions">
          <SerieActions manga={manga} setManga={setManga} />
        </div>
        <section className="serieChapters">
          <ChaptersInfo manga={manga} />
        </section>
      </section>
      <aside className="seriesInfo">
        <section className="favorites">
          <h3>Séries Favoritas</h3>
          <ul className="fav-series">
            {favCollection.series.map((serie) => (
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
