import { useParams, Link } from 'react-router-dom';
import { Tag, Book } from 'lucide-react';

import { Manga } from 'electron/types/manga.interfaces';
import useAction from '@/hooks/useAction';

import Loading from '../../components/Loading/Loading';
import DownloadButton from '../../components/DonwloadButton/DownloadButton';
import Rating from '../../components/Rating/Rating';
import CollectionButton from '../../components/CollectionButton/CollectionButton';
import Favorite from '../../components/FavoriteButton/Favorite';
import ListView from '../../components/ListView/ListView';
import useCollection from '../../hooks/useCollection';
import useSerieStore from '../../store/useSerieStore';
import { useUIStore } from '../../store/useUIStore';
import useSerie from '../../hooks/useSerie';
import styles from './MangaPage.module.scss';

export default function MangaPage() {
  const { manga_name: rawSerieName } = useParams<{ manga_name: string }>();
  const serie_name = decodeURIComponent(rawSerieName ?? '');
  useSerie(serie_name, 'Manga');
  const serie = useSerieStore((state) => state.serie) as Manga;
  const loading = useUIStore((state) => state.loading);
  const { favorites, recents } = useCollection();
  const { lastChapter } = useAction();

  const orderFav = () => {
    return favorites
      ? [...favorites.series].sort((a, b) => b.rating - a.rating)
      : [];
  };

  const orderRecent = () => {
    return recents
      ? [...recents.series].sort((a, b) => new Date(b.addAt).getTime() - new Date(a.addAt).getTime()).slice(0, 5)
      : [];
  };

  if (loading || !serie || !serie.chapters) {
    return <Loading />;
  }

  const tags = [...serie.tags].sort((a, b) => a.localeCompare(b)).slice(0, 2);

  return (
    <main className={styles.mangaPage}>
      <figure className={styles.imageContainer}>
        <img
          className={styles.mangaCover}
          src={`${serie.coverImage}`}
          alt={`Capa do quadrinho ${serie.name}`}
        />
        <figcaption className={styles.mangaTags}>
          <div>
            {tags.map((tag) => (
              <span key={tag}>
                <Tag /> {tag}
              </span>
            ))}
          </div>
          <p className={styles.owner}>
            Upload por: {serie.metadata.originalOwner}
          </p>
          <p className={styles.recomend}>
            recomendada por: {serie.metadata.recommendedBy}
          </p>
        </figcaption>
      </figure>
      <section className={styles.mangaInfo}>
        <span className={styles.serieTitle}>
          <h1>{serie.name}</h1>
        </span>
        <div className={styles.mangaMetadata}>
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
        <div className={styles.serieActions}>
          <DownloadButton serie={serie} />

          <Favorite serie={serie} />

          <CollectionButton dataPath={serie.dataPath} serieData={serie} />
          <button
            className={styles.reading}
            onClick={(e) => lastChapter(e, serie.id)}
          >
            <Book />
            Continuar
          </button>

          <Rating serie={serie} />
        </div>
        <ListView />
      </section>
      <aside className={styles.collectionInfos}>
        <div className={styles.favCollection}>
          <h3>Séries Favoritas</h3>
          <ul>
            {orderFav().map((serie, idx) => (
              <li key={idx}>
                <Link to={`/Manga/${serie.name}/:${serie.id}`}>
                  <span>{serie.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.recCollection}>
          <h3>Últimas séries lidas</h3>
          <ul>
            {orderRecent().map((col, idx) => (
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
