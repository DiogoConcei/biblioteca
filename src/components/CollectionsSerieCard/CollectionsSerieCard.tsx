import { SerieInCollection } from '@/types/collections.interfaces';

import styles from './CollectionsSerieCard.module.scss';

interface CollectionSeriesCardProps {
  serie: SerieInCollection;
}

export default function CollectionSeriesCard({
  serie,
}: CollectionSeriesCardProps) {
  return (
    <article className={styles.card}>
      <img src={serie.coverImage} alt={serie.name} className={styles.cover} />

      <div className={styles.content}>
        <h3>{serie.name}</h3>
        <p>{serie.description || 'Descrição ainda não disponível.'}</p>
      </div>
    </article>
  );
}
