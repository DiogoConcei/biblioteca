import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CirclePlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import useCollection from '@/hooks/useCollection';
import useAllSeries from '@/hooks/useAllSeries';
import useAction from '@/hooks/useAction';
import CreateCollection from '@/components/CreateCollection/CreateCollection';
import { Collection } from '@/types/collections.interfaces';

import CollectionsMenu from '../../components/CollectionsMenu/CollectionsMenu';
import CollectionView from '../../components/CollectionView/CollectionView';
import styles from './Collections.module.scss';

const SPECIAL_COLLECTIONS = new Set(['Favoritos', 'Recentes']);

export default function Collections() {
  const { lastChapter } = useAction();

  const {
    collections,
    createCollection,
    deleteCollection,
    removeSerie,
    updateSerieBackground,
    reorderSeries,
    addToCollection,
  } = useCollection();
  const allSeries = useAllSeries();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSerieIndex, setActiveSerieIndex] = useState(0);
  const [isAddSerieOpen, setIsAddSerieOpen] = useState<boolean>(false);
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

  const selectableSeries = useMemo(() => {
    if (!allSeries || !activeCollection) return [];

    const existingSeriesIds = new Set(
      activeCollection.series.map((serie) => serie.id),
    );

    return allSeries.filter((serie) => !existingSeriesIds.has(serie.id));
  }, [activeCollection, allSeries]);

  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgIsPortrait, setBgIsPortrait] = useState(false);
  const [bgError, setBgError] = useState(false);

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

        {activeBackground && <div className={styles.backgroundOverlay} />}
      </div>

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
              <>
                <button
                  className={styles['add-btn']}
                  onClick={() => setIsAddSerieOpen(true)}
                  aria-label="Adicionar série na coleção ativa"
                >
                  Adicionar Série
                </button>
                <button
                  className={styles['add-btn']}
                  onClick={() => deleteCollection(activeCollection.name)}
                  aria-label="Remover coleção ativa"
                >
                  Excluir coleção
                </button>
              </>
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
            onOpenReader={(e, serieId) => {
              if (!serieId) return;

              lastChapter(e, serieId);
            }}
            onRemoveFromCollection={async (collectionName, serieId) => {
              return removeSerie(collectionName, serieId);
            }}
            onReorderSeries={reorderSeries}
            onUpdateSerieBackground={async (collectionName, serieId, path) => {
              return updateSerieBackground(collectionName, serieId, path);
            }}
          />
        </main>
      </div>

      <CreateCollection
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCreate={onCreateCollection}
        series={allSeries}
      />

      {isAddSerieOpen && activeCollection && (
        <div
          className={styles.seriesModalOverlay}
          onClick={() => setIsAddSerieOpen(false)}
        >
          <div
            className={styles.seriesModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.seriesModalHeader}>
              <h3>Adicionar Série</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsAddSerieOpen(false)}
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.seriesGrid}>
              {selectableSeries.map((serie) => (
                <button
                  key={serie.id}
                  type="button"
                  className={styles.serieCard}
                  onClick={async () => {
                    const added = await addToCollection(
                      serie.dataPath,
                      activeCollection.name,
                      {
                        id: serie.id,
                        name: serie.name,
                        coverImage: serie.coverImage,
                        dataPath: serie.dataPath,
                        totalChapters: serie.totalChapters,
                      },
                    );

                    if (added) {
                      setIsAddSerieOpen(false);
                    }
                  }}
                >
                  <img
                    src={serie.coverImage}
                    alt={`Capa da série ${serie.name}`}
                  />
                  <span>{serie.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
