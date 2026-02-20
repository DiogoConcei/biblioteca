import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CirclePlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import useCollection from '@/hooks/useCollection';

import CreateCollection from '@/components/CreateCollection/CreateCollection';
import { Collection } from '@/types/collections.interfaces';

import CollectionsMenu from '../../components/CollectionsMenu/CollectionsMenu';
import CollectionView from '../../components/CollectionView/CollectionView';

import styles from './Collections.module.scss';

const SPECIAL_COLLECTIONS = new Set(['Favoritos', 'Recentes']);

export default function Collections() {
  const navigate = useNavigate();
  const {
    collections,
    createCollection,
    deleteCollection,
    removeSerie,
    updateSerieBackground,
    reorderSeries,
  } = useCollection();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSerieIndex, setActiveSerieIndex] = useState(0);

  const visibleCollections = useMemo(
    () =>
      collections.filter(
        (collection) =>
          !SPECIAL_COLLECTIONS.has(collection.name) ||
          collection.series.length > 0,
      ),
    [collections],
  );

  const activeCollection = visibleCollections[activeIndex] ?? null;
  const activeSerie = activeCollection?.series[activeSerieIndex] ?? null;
  const activeBackground = activeSerie?.backgroundImage ?? null;

  // background state
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgIsPortrait, setBgIsPortrait] = useState(false);
  const [bgError, setBgError] = useState(false);

  // reset background flags when changing activeBackground
  useEffect(() => {
    setBgLoaded(false);
    setBgIsPortrait(false);
    setBgError(false);

    if (!activeBackground) return;

    const img = new Image();
    img.src = activeBackground;

    img.onload = () => {
      setBgIsPortrait(img.naturalHeight > img.naturalWidth);
      setBgLoaded(true);
      setBgError(false);
    };

    img.onerror = () => {
      setBgLoaded(false);
      setBgIsPortrait(false);
      setBgError(true);
    };

    // no cleanup necessary for Image object
  }, [activeBackground]);

  const nextCollection = useCallback(() => {
    if (!visibleCollections.length) return;
    setActiveIndex((prev) => (prev + 1) % visibleCollections.length);
    setActiveSerieIndex(0);
  }, [visibleCollections.length]);

  const prevCollection = useCallback(() => {
    if (!visibleCollections.length) return;
    setActiveIndex(
      (prev) =>
        (prev - 1 + visibleCollections.length) % visibleCollections.length,
    );
    setActiveSerieIndex(0);
  }, [visibleCollections.length]);

  const onCreateCollection = async (
    collectionData: Omit<Collection, 'createdAt' | 'updatedAt'>,
  ) => {
    await createCollection(collectionData);
  };

  useEffect(() => {
    setActiveIndex((current) => {
      if (!visibleCollections.length) return 0;
      if (current >= visibleCollections.length)
        return visibleCollections.length - 1;
      return current;
    });
  }, [visibleCollections]);

  useEffect(() => {
    const total = activeCollection?.series.length ?? 0;

    setActiveSerieIndex((current) => {
      if (!total) return 0;
      if (current >= total) return total - 1;
      return current;
    });
  }, [activeCollection?.name, activeCollection?.series.length]);

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        nextCollection();
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        prevCollection();
      }
    };

    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [nextCollection, prevCollection]);

  return (
    <section
      className={[
        styles.container,
        activeBackground && bgLoaded && !bgError ? styles.hasBackground : '',
      ].join(' ')}
    >
      {/* BACKGROUND LAYER */}
      <div className={styles.backgroundContainer} aria-hidden>
        {!activeBackground && <div className={styles.stars} />}

        {activeBackground && !bgError && (
          <img
            className={[
              styles.bgImg,
              bgLoaded ? styles.loaded : '',
              bgIsPortrait ? styles.portrait : '',
            ].join(' ')}
            src={activeBackground}
            alt=""
            onLoad={() => setBgLoaded(true)}
            draggable={false}
          />
        )}

        {/* fallback overlay for contrast */}
        {activeBackground && <div className={styles.backgroundOverlay} />}
      </div>

      {/* PAGE CONTENT */}
      <header className={styles.header}>
        <Link to="/" className={styles.backButton}>
          <ArrowLeft />
          Voltar para Home
        </Link>
      </header>

      <div className={styles.layout}>
        <CollectionsMenu
          collections={visibleCollections}
          activeIndex={activeIndex}
          onSelect={(index) => {
            setActiveIndex(index);
            setActiveSerieIndex(0);
          }}
          onPrev={prevCollection}
          onNext={nextCollection}
        />

        <main className={styles.viewerArea}>
          <div className={styles.viewerTopBar}>
            {activeCollection && (
              <button
                className={styles['add-btn']}
                onClick={() => deleteCollection(activeCollection.name)}
                aria-label="Remover coleção ativa"
              >
                Excluir coleção
              </button>
            )}
            <button
              className={styles['add-btn']}
              onClick={() => setIsOpen(true)}
              aria-label="Adicionar coleção"
            >
              <CirclePlus />
              <span>Nova coleção</span>
            </button>
          </div>

          <CollectionView
            collection={activeCollection}
            activeIndex={activeSerieIndex}
            onChangeIndex={setActiveSerieIndex}
            onOpenReader={(seriesId) => {
              const serie = activeCollection?.series.find(
                (item) => item.id === seriesId,
              );
              if (!serie) return;
              navigate(
                `/${encodeURIComponent(serie.name)}/${serie.id}/Capitulo/1/1/false`,
              );
            }}
            onRemoveFromCollection={async (collectionName, serieId) => {
              await removeSerie(collectionName, serieId);
            }}
            onReorderSeries={reorderSeries}
            onUpdateSerieBackground={async (collectionName, serieId, path) => {
              await updateSerieBackground(collectionName, serieId, path);
            }}
          />
        </main>
      </div>

      <CreateCollection
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCreate={onCreateCollection}
      />
    </section>
  );
}
