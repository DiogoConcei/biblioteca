import { Collection } from '@/types/collections.interfaces';

import CollectionSeriesCard from '../CollectionsSerieCard/CollectionsSerieCard';
import styles from './CollectionView.module.scss';

interface CollectionSeriesViewProps {
  activeCollection: Collection | null;
}

export default function CollectionView({
  activeCollection,
}: CollectionSeriesViewProps) {
  if (!activeCollection) {
    return (
      <section className={styles.emptyState}>
        <h2>Nenhuma coleção disponível</h2>
      </section>
    );
  }

  if (!activeCollection.series.length) {
    return (
      <section className={styles.emptyState}>
        <h2>{activeCollection.name}</h2>
        <p>Essa coleção ainda não possui séries.</p>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <header>
        <h2>{activeCollection.name}</h2>
        <p>{activeCollection.description || 'Sem descrição da coleção.'}</p>
      </header>

      <div className={styles.grid}>
        {activeCollection.series.map((serie) => (
          <CollectionSeriesCard key={serie.id} serie={serie} />
        ))}
      </div>
    </section>
  );
}
