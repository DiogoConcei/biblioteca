import { Manga } from "../../types/manga.interfaces";

import { Link, useParams } from "react-router-dom";
import { CiShoppingTag } from "react-icons/ci";

import ChaptersInfo from "../../components/ChaptersInfo/ChaptersInfo";
import SerieActions from "../../components/SerieActions/SerieActions";
import ErrorScreen from "../../components/ErrorScreen/ErrorScreen";

import useSerie from "../../hooks/useSerie";
import useCollection from "../../hooks/useCollection";

import "./MangaPage.css";

export default function MangaPage() {
  const { manga_name } = useParams();
  const data = useSerie(manga_name);
  const serie = data.serie as Manga;
  const { updateSerie, updateChapters, loading, error } = data;

  const { favCollection, updateFav } = useCollection();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return (
      <ErrorScreen
        error={error}
        serieName={manga_name}
        dinamicRedirect="Home"
      />
    );
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
            src={`data:image;base64,${serie.coverImage}`}
            alt={`Capa do quadrinho ${serie.name}`}
          />
          <figcaption className="mangaTags">
            {serie.tags.map((tag) => (
              <span key={tag}>
                <CiShoppingTag /> {tag}
              </span>
            ))}
          </figcaption>
        </figure>
        <h2 className="owner">Upload por: {serie.metadata.originalOwner}</h2>
        <h2 className="recomend">
          recomendada por: {serie.metadata.recommendedBy}
        </h2>
      </div>
      <section className="mainContent">
        <h2>{serie.name}</h2>
        <div className="serieMetadata">
          <p>Status: {serie.metadata.status}</p>
          <p>Capítulos lidos: {serie.chaptersRead}</p>
          <p>Quantidade de capítulos: {serie.totalChapters}</p>
          <p>Criado em: {serie.createdAt}</p>
          {serie.readingData.lastChapterId ? (
            <p>Último capítulo lido: {serie.readingData.lastChapterId}</p>
          ) : (
            <p></p>
          )}
        </div>
        <div className="serieActions">
          <SerieActions
            manga={serie}
            updateSerie={updateSerie}
            updateFavCollection={updateFav}
          />
        </div>
        <section className="serieChapters">
          <ChaptersInfo
            manga={serie}
            updateSerie={updateSerie}
            updateChapters={updateChapters}
          />
        </section>
      </section>
      <section className="serieHeader">
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
    </section>
  );
}
