import { Star, History } from 'lucide-react';
import { Collection } from '@/types/collections.interfaces';
import styles from './CollectionCard.module.scss';

interface CollectionCardProps {
  collection: Collection;
}

const SPECIAL_ICONS: Record<string, JSX.Element> = {
  Favoritos: <Star size={18} />,
  Recentes: <History size={18} />,
};

export default function CollectionCard({ collection }: CollectionCardProps) {
  const specialIcon = SPECIAL_ICONS[collection.name];

  const isSpecial =
    collection.name === 'Favoritos' || collection.name === 'Recentes';

  const highestRatedSerie =
    isSpecial && collection.series.length > 0
      ? [...collection.series].sort((a, b) => b.rating - a.rating)[0]
      : null;

  const cover = highestRatedSerie?.coverImage || collection.coverImage;

  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}>
        <img src={cover} alt={collection.name} />

        {specialIcon && <span className={styles.badge}>{specialIcon}</span>}
      </div>

      <div className={styles.info}>
        <h3>{collection.name}</h3>
        <span>{collection.series.length} séries</span>
      </div>
    </div>
  );
}
