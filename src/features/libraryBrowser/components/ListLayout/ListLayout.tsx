import { Tag, Book } from 'lucide-react';
import { StoreSerie } from '@/shared/store/useSerieStore';
import useAction from '@/shared/hooks/useAction';
import DownloadButton from '@/shared/components/DonwloadButton/DownloadButton';
import Rating from '@/shared/components/Rating/Rating';
import CollectionButton from '../CollectionButton/CollectionButton';
import Favorite from '@/shared/components/FavoriteButton/Favorite';
import ListView from '../ListView/ListView';
import { useCollectionStore } from '@/shared/store/useCollectionStore';
import styles from './ListLayout.module.scss';
import { Link } from 'react-router-dom';

export default function ListLayout({ serie }: { serie: StoreSerie }) {
  const favorites = useCollectionStore((s) => s.favorites);
  const recents = useCollectionStore((s) => s.recents);
  const { lastChapter } = useAction();

  // const tags = [...serie.tags].sort((a, b) => a.localeCompare(b)).slice(0, 2);

  const orderFavByName = () => {
    if (!favorites || !favorites.series) return [];

    return [...favorites.series].sort((a, b) => a.name.localeCompare(b.name));
  };

  const orderRecentByName = () => {
    if (!recents || !recents.series) return [];

    return [...recents.series].sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <main className={styles.mangaPage}>
      <figure className={styles.imageContainer}>
        <img
          className={styles.mangaCover}
          src={`${serie.coverImage}`}
          alt={`Capa do quadrinho ${serie.name}`}
        />
        <figcaption className={styles.mangaTags}>
          {/* <div>
            {tags.map((tag) => (
              <span key={tag}>
                <Tag /> {tag}
              </span>
            ))}
          </div> */}
          <p className={styles.owner}>Upload por: {serie.metadata.originalOwner}</p>
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
          {/* <DownloadButton serie={serie} />          */}
          <Favorite serie={serie} />
          <CollectionButton dataPath={serie.dataPath} serieData={serie} />
          <button className={styles.reading} onClick={(e) => lastChapter(e, serie.id)}>
            <Book />
            Continuar
          </button>

          {/* <Rating serie={serie} /> */}
        </div>
        <ListView />
      </section>
      <aside className={styles.collectionInfos}>
        <div className={styles.favCollection}>
          <h3>Séries Favoritas</h3>
          <ul>
            {orderFavByName().map((fav, idx) => (
              <li key={idx}>
                <Link to={`/Manga/${fav.name}/${fav.id}`}>
                  <span>{fav.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.recCollection}>
          <h3>Últimas séries lidas</h3>
          <ul>
            {orderRecentByName().map((recent, idx) => (
              <li key={idx}>
                <Link to={`/Manga/${recent.name}/${recent.id}`}>
                  <span>{recent.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>{' '}
    </main>
  );
}
