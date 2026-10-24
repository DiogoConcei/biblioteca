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
import useHistory from '@/shared/hooks/useHistory';
import { useMemo } from 'react';

const progressPercent = (read: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((read / total) * 100)) : 0;

const MAX_SHELF = 6;

export default function ListLayout({ serie }: { serie: StoreSerie }) {
  // const tags = [...serie.tags].sort((a, b) => a.localeCompare(b)).slice(0, 2);
  const favorites = useCollectionStore((s) => s.favorites);
  const { recentSeries } = useHistory();
  const { lastChapter } = useAction();

  const favs = useMemo(
    () => [...(favorites?.series ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [favorites],
  );
  const visibleFavs = favs.length > MAX_SHELF ? favs.slice(0, MAX_SHELF - 1) : favs;
  const hiddenFavs = favs.length - visibleFavs.length;
  const recents = recentSeries ?? [];

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
        <ListView literatureForm={serie.literatureForm} />
      </section>
      <aside className={styles.collectionInfos}>
        <section className={styles.panelSection}>
          <header className={styles.panelHeader}>
            <h3>Favoritas</h3>
            <span className={styles.count}>{favs.length}</span>
          </header>

          {favs.length === 0 ? (
            <p className={styles.empty}>Favorite uma série para vê-la aqui.</p>
          ) : (
            <ul className={styles.shelf}>
              {visibleFavs.map((fav) => (
                <li key={fav.id}>
                  <Link
                    to={`/${fav.literatureForm}/${encodeURIComponent(fav.name)}/${fav.id}`}
                    className={styles.cover}
                    title={fav.name}
                    aria-label={fav.name}
                    aria-current={fav.id === serie.id ? 'page' : undefined}
                  >
                    <img src={fav.coverImage} alt="" loading="lazy" decoding="async" />
                    <span className={styles.coverName}>{fav.name}</span>
                  </Link>
                </li>
              ))}
              {hiddenFavs > 0 && <li className={styles.more}>+{hiddenFavs}</li>}
            </ul>
          )}
        </section>

        <section className={styles.panelSection}>
          <header className={styles.panelHeader}>
            <h3>Últimas lidas</h3>
          </header>

          {recents.length === 0 ? (
            <p className={styles.empty}>Leia um capítulo para ver suas séries aqui.</p>
          ) : (
            <ul className={styles.recents}>
              {recents.map((recent) => {
                const percent = progressPercent(
                  recent.chaptersRead,
                  recent.totalChapters,
                );
                return (
                  <li key={recent.serieId}>
                    <Link
                      to={`/${recent.literatureForm}/${encodeURIComponent(recent.serieName)}/${recent.serieId}`}
                      className={styles.recentRow}
                    >
                      <img
                        className={styles.recentCover}
                        src={recent.coverImage}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <div className={styles.recentInfo}>
                        <span className={styles.recentName}>{recent.serieName}</span>
                        <div className={styles.recentMetaRow}>
                          <span>
                            {recent.chaptersRead} de {recent.totalChapters} lidos
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div
                          className={styles.progress}
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${percent}% lido`}
                        >
                          <div
                            className={styles.progressBar}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </aside>{' '}
    </main>
  );
}
