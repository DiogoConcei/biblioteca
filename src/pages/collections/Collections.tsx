import useCollection from '@/hooks/useCollection';
import CollectionCard from '@/components/CollectionCard/CollectionCard';
import { CirclePlus, Star, History } from 'lucide-react';
import styles from './Collections.module.scss';

export default function Collections() {
  const { collections } = useCollection();

  return (
    <section className={styles.container}>
      <aside className={styles.menu}>
        {collections.map((col) => (
          <CollectionCard key={col.name} collection={col} />
        ))}
        <button className={styles['add-btn']}>
          <CirclePlus color="#cd5c5c" />
        </button>
      </aside>

      <main>
        <p>Visualização</p>
      </main>
    </section>
  );
}
