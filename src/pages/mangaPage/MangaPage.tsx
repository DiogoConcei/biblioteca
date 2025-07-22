import { Link, useParams, useNavigate } from "react-router-dom";
import { Tag, Bookmark, BookmarkCheck, Book } from "lucide-react";
import { useMemo } from "react";

import { Manga } from "electron/types/manga.interfaces";

import DownloadButton from "../../components/DonwloadButton/DownloadButton";
import Rating from "../../components/Rating/Rating";
import CollectionButton from "../../components/CollectionButton/CollectionButton";
import useSerie from "../../hooks/useSerie";
import { useSerieStore } from "../../store/seriesStore";
import ErrorScreen from "../../components/ErrorScreen/ErrorScreen";
import useCollection from "../../hooks/useCollection";
import "./MangaPage.scss";
import ChaptersView from "../../components/ChaptersView/ChaptersView";

export default function MangaPage() {
  const { manga_name } = useParams<{
    manga_name: string;
  }>();
  const navigate = useNavigate();

  const { serie: rawSerie, updateSerie } = useSerie(manga_name!, "Manga");
  const serie = rawSerie as Manga;
  const loading = useSerieStore((state) => state.loading);
  const error = useSerieStore((state) => state.error);
  const { favorites, collections, updateFav } = useCollection();

  const orderFav = useMemo(() => {
    return favorites
      ? [...favorites.series].sort((a, b) => b.rating - a.rating)
      : [];
  }, [favorites]);

  const orderRecent = useMemo(() => {
    const recentes = collections.find((col) => col.name === "Recentes");

    if (!recentes || !recentes.series) return [];

    return [...recentes.series]
      .sort((a, b) => new Date(b.addAt).getTime() - new Date(a.addAt).getTime())
      .slice(0, 5);
  }, [collections]);

  if (error) {
    return <ErrorScreen error={error} serieName={manga_name!} />;
  }

  if (loading || !serie) {
    return <div className="loading">Carregando...</div>;
  }

  const lastRead = async (
    event: React.MouseEvent<HTMLButtonElement>,
    dataPath: string
  ) => {
    event.preventDefault();
    const response = await window.electronAPI.chapters.acessLastRead(dataPath);

    if (!response.success) {
      console.error(`Erro ao acessar último capítulo lido: ${response.error}`);
      return;
    }

    const lastChapterUrl = response.data;

    navigate(`${lastChapterUrl}`);
  };

  const favoriteSerie = async (isFav: boolean) => {
    const newFavoriteStatus = !isFav;
    updateSerie("metadata.isFavorite", newFavoriteStatus);

    const response = updateFav(serie, newFavoriteStatus);

    if (!response) {
      updateSerie("metadata.isFavorite", isFav);
    }
  };

  const tags = [...serie.tags].sort((a, b) => a.localeCompare(b)).slice(0, 5);

  return (
    <main className="mangaPage">
      <figure className="imageContainer">
        <img
          className="mangaCover"
          src={`data:image;base64,${serie.coverImage}`}
          alt={`Capa do quadrinho ${serie.name}`}
        />
        <figcaption className="mangaTags">
          <div>
            {tags.map((tag) => (
              <span key={tag}>
                <Tag /> {tag}
              </span>
            ))}
          </div>
          <p className="owner">Upload por: {serie.metadata.originalOwner}</p>
          <p className="recomend">
            recomendada por: {serie.metadata.recommendedBy}
          </p>
        </figcaption>
      </figure>
      <section className="mangaInfo">
        <span className="serieTitle">
          <h1>{serie.name}</h1>{" "}
        </span>
        <div className="mangaMetadata">
          <p>Status: {serie.metadata.status}</p>
          <p>Capítulos lidos: {serie.chaptersRead}</p>
          <p>Quantidade de capítulos: {serie.totalChapters}</p>
          <p>Criado em: {new Date(serie.createdAt).toLocaleDateString()}</p>
          {serie.chaptersRead ? (
            <p>Último capítulo lido: {serie.readingData.lastChapterId}</p>
          ) : (
            <p></p>
          )}
        </div>
        <div className="serieActions">
          <DownloadButton serie={serie} updateSerie={updateSerie} />

          <button
            className="favorite"
            onClick={() => favoriteSerie(serie.metadata.isFavorite)}
          >
            {serie.metadata.isFavorite ? <Bookmark /> : <BookmarkCheck />}
            Favoritar
          </button>

          <CollectionButton dataPath={serie.dataPath} />

          <button
            className="reading"
            onClick={(event) => lastRead(event, serie.dataPath)}
          >
            <Book />
            Continuar
          </button>

          <Rating manga={serie} />
        </div>
        <ChaptersView updateSerie={updateSerie} />
      </section>
      <aside className="collectionInfos">
        <div className="favCollection">
          <h3>Séries Favoritas</h3>
          <ul>
            {orderFav?.map((serie) => (
              <li key={serie.id}>
                <Link to={`/Manga/${serie.name}/:${serie.id}`}>
                  <span>{serie.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="recCollection">
          <h3>Últimas séries lidas</h3>
          <ul>
            {orderRecent.map((col, idx) => (
              <li key={idx}>
                <Link to={`/Manga/${serie.name}/:${serie.id}`}>
                  <span>{col.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
