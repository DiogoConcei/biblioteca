import { useMemo, useEffect } from 'react';
import { Tag, Book } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StoreSerie } from '@/shared/store/useSerieStore';
import { useCollectionStore } from '@/shared/store/useCollectionStore';
import useImage from '@/shared/hooks/useImage';
import useHistory from '@/shared/hooks/useHistory';
import ListView from '../ListView/ListView';
import QuicklyFavorite from '../QuicklyFavorite/QuicklyFavorite';
import QuicklyRating from '../QuicklyRating/QuicklyRating';
import QuicklyCollections from '../QuicklyCollections/QuicklyCollections';
import styles from './ListLayout.module.scss';

const progressPercent = (read: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((read / total) * 100)) : 0;

const MAX_SHELF = 6;

export default function ListLayout({ serie }: { serie: StoreSerie }) {
  const { previewSrc: bgSrc, loadExistingImage } = useImage();

  // const tags = [...serie.tags].sort((a, b) => a.localeCompare(b)).slice(0, 3);

  useEffect(() => {
    loadExistingImage(serie.backgroundImage ?? '');
  }, [serie.backgroundImage, loadExistingImage]);

  const favorites = useCollectionStore((s) =>
    s.collections.find((c) => c.name === 'Favoritos'),
  );
  const { recentSeries } = useHistory();

  const favs = useMemo(
    () => [...(favorites?.series ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [favorites],
  );
  const visibleFavs = favs.length > MAX_SHELF ? favs.slice(0, MAX_SHELF - 1) : favs;
  const hiddenFavs = favs.length - visibleFavs.length;
  const recents = recentSeries ?? [];

  const pageStyle = bgSrc
    ? ({ '--bg-image': `url("${bgSrc}")` } as React.CSSProperties)
    : undefined;

  return (
    <main className={styles.mangaPage} style={pageStyle}>
      <figure className={styles.imageContainer}>
        <img
          className={styles.mangaCover}
          src={`${serie.coverImage}`}
          alt={`Capa do quadrinho ${serie.name}`}
        />
        <figcaption className={styles['serie-actions']}>
          <QuicklyFavorite isFavorite={serie.metadata.isFavorite} />
          <QuicklyCollections serie={serie} />
          <QuicklyRating serie={serie} />
        </figcaption>
      </figure>
      <section className={styles.mangaInfo}>
        {/* <span className={styles.serieTitle}>
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
        </div> */}
        {/* <div className={styles.serieActions}> */}

        {/* </div> */}
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
      </aside>
    </main>
  );
}
{
  /* <div>
            {tags.map((tag) => (
              <span key={tag}>
                <Tag /> {tag}
              </span>
            ))}
          </div> */
}
{
  /* {serie.metadata.originalOwner && (
            <p className={styles.owner}>Upload por: {serie.metadata.originalOwner}</p>
          )}
          {serie.metadata.recommendedBy && (
            <p className={styles.recomend}>
              recomendada por: {serie.metadata.recommendedBy}
            </p>
          )} */
}
