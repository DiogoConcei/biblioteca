import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CirclePlus } from 'lucide-react';
import { Link } from 'react-router-dom';

import useCollection from '@/hooks/useCollection';

import CreateCollection from '@/components/CreateCollection/CreateCollection';
import { Collection } from '@/types/collections.interfaces';

import CollectionsMenu from '../../components/CollectionsMenu/CollectionsMenu';
import CollectionView from '../../components/CollectionView/CollectionView';

import styles from './Collections.module.scss';

const SPECIAL_COLLECTIONS = new Set(['Favoritos', 'Recentes']);

export default function Collections() {
  const { collections, createCollection } = useCollection();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

  const nextCollection = useCallback(() => {
    if (!visibleCollections.length) return;
    setActiveIndex((prev) => (prev + 1) % visibleCollections.length);
  }, [visibleCollections.length]);

  const prevCollection = useCallback(() => {
    if (!visibleCollections.length) return;
    setActiveIndex(
      (prev) =>
        (prev - 1 + visibleCollections.length) % visibleCollections.length,
    );
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
    <section className={styles.container}>
      <div className={styles.stars} />

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
          onSelect={setActiveIndex}
          onPrev={prevCollection}
          onNext={nextCollection}
        />

        <main className={styles.viewerArea}>
          <div className={styles.viewerTopBar}>
            <button
              className={styles['add-btn']}
              onClick={() => setIsOpen(true)}
              aria-label="Adicionar coleção"
            >
              <CirclePlus />
              <span>Nova coleção</span>
            </button>
          </div>

          <CollectionView activeCollection={activeCollection} />
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
