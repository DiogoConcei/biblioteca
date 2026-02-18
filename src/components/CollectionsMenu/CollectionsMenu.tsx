import { ChevronUp, ChevronDown } from 'lucide-react';

import { Collection } from '@/types/collections.interfaces';

import styles from './CollectionsMenu.module.scss';
import CollectionCard from '../CollectionCard/CollectionCard';

interface CollectionsCarouselMenuProps {
  collections: Collection[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function CollectionsMenu({
  collections,
  activeIndex,
  onSelect,
  onPrev,
  onNext,
}: CollectionsCarouselMenuProps) {
  return (
    <aside className={styles.carousel}>
      <button
        className={styles.navButton}
        onClick={onPrev}
        aria-label="Coleção anterior"
      >
        <ChevronUp />
      </button>

      <ul className={styles.list}>
        {collections.map((coll, idx) => {
          const isActive = activeIndex === idx;

          return (
            <li key={coll.name}>
              <button
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onClick={() => onSelect(idx)}
                aria-pressed={isActive}
              >
                <CollectionCard collection={coll} key={idx} />
              </button>
            </li>
          );
        })}
      </ul>

      <button
        className={styles.navButton}
        onClick={onNext}
        aria-label="Próxima coleção"
      >
        <ChevronDown />
      </button>
    </aside>
  );
}
