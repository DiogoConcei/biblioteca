import { Link, useParams } from "react-router-dom";
import { CiShoppingTag } from "react-icons/ci";
import { Manga } from "../../types/manga.interfaces";
import { Collection } from "../../types/collections.interfaces";
import { useState, useEffect } from "react";
import ChaptersInfo from "../../components/ChaptersInfo/ChaptersInfo";
import SerieActions from "../../components/SerieActions/SerieActions";
import "./MangaPage.css";

export default function MangaPage() {
  const [manga, setManga] = useState<Manga | null>(null);
  const [favCollection, setfavCollection] = useState<Collection | null>(null);
  const { manga_name } = useParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      (async () => {
        try {
          const data = await window.electron.manga.getManga(manga_name);
          const favSeries = await window.electron.collections.getFavSeries();
          setManga(data);
          setfavCollection(favSeries);
        } catch (error) {
          console.error("Erro ao carregar manga:", error);
        }
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, [manga_name]);

  if (!manga || !favCollection) {
    return null;
  }
  const filterFavs = [...favCollection.series]
    .sort((a, b) => a.rating - b.rating)
    .slice(0, 5);

  return (
    <section className="serieHeader">
      <div className="archivesInfo">
        <figure className="imageContainer">
          <img
            className="serieCover"
            src={`data:image;base64,${manga.coverImage}`}
            alt={`Capa do quadrinho ${manga.name}`}
          />
          <figcaption className="mangaTags">
            {manga.tags.map((tag) => (
              <span key={tag}>
                <CiShoppingTag /> {tag}
              </span>
            ))}
          </figcaption>
        </figure>
        <h2 className="owner">Upload por: {manga.metadata.originalOwner}</h2>
        <h2 className="recomend">
          recomendada por: {manga.metadata.recommendedBy}
        </h2>
      </div>
      <section className="mainContent">
        <h2>{manga.name}</h2>
        <div className="serieMetadata">
          <p>Status: {manga.metadata.status}</p>
          <p>Capítulos lidos: {manga.chaptersRead}</p>
          <p>Quantidade de capítulos: {manga.totalChapters}</p>
          <p>Criado em: {manga.createdAt}</p>
          {manga.readingData.lastChapterId ? (
            <p>Último capítulo lido: {manga.readingData.lastChapterId}</p>
          ) : (
            <p></p>
          )}
        </div>
        <div className="serieActions">
          <SerieActions
            manga={manga}
            setManga={setManga}
            setfavCollection={setfavCollection}
          />
        </div>
        <section className="serieChapters">
          <ChaptersInfo manga={manga} setManga={setManga} />
        </section>
      </section>
      <aside className="seriesInfo">
        <section className="favorites">
          <h3>Séries Favoritas</h3>
          <ul className="fav-series">
            {filterFavs.map((serie) => (
              <li key={serie.id}>
                <Link
                  to={`/Manga/${serie.name}/:${serie.id}`}
                  className="DinamicLink"
                >
                  {serie.name}
                </Link>
              </li>
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
