import { useEffect, useState, useMemo } from 'react';
import { List } from 'lucide-react';

import { CollectionButtonProps } from '@/shared/types/components.interfaces';
import useCollection from '@/shared/hooks/useCollection';
import styles from './CollectionButton.module.scss';
import CollectionsView from '../CollectionsView/CollectionsView';

export default function CollectionButton({ serie }: CollectionButtonProps) {
  const { collections } = useCollection();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const activeCollections = useMemo(() => {
    if (!collections || !serie) return [];

    return collections.filter((coll) => coll.series.some((s) => s.id === serie.id));
  }, [collections, serie]);

  useEffect(() => {
    if (activeCollections.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeCollections.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeCollections.length]);

  const currentCollection = activeCollections[currentIndex];

  return (
    <div>
      <button
        type="button"
        className={styles.collection}
        onClick={() => setIsOpen(true)}
        aria-label="Gerenciar coleções"
      >
        {activeCollections.length > 0 && currentCollection ? (
          <div key={currentCollection.name} className={styles.dynamicContent}>
            <img src={currentCollection.coverImage} alt="" className={styles.miniCover} />
            <span className={styles.collectionName}>{currentCollection.name}</span>
          </div>
        ) : (
          <div className={styles.defaultContent}>
            <List size={20} />
            <span>Coleções</span>
          </div>
        )}
      </button>

      {isOpen && (
        <CollectionsView onClose={() => setIsOpen(false)} collections={collections} />
      )}
    </div>
  );
}
