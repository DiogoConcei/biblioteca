import { useState } from 'react';
import { GripVertical } from 'lucide-react';

import { SerieInCollection } from '@/types/collections.interfaces';

import styles from './CollectionsSerieCard.module.scss';

interface CollectionSeriesCardProps {
  activeSerieIndex: number;
  serieIndex: number;
  serie: SerieInCollection;
  onDropOnCard: (sourceId: number, targetId: number) => Promise<void>;
  onActivate: () => void;
}

export default function CollectionSeriesCard({
  serieIndex,
  activeSerieIndex,
  serie,
  onDropOnCard,
  onActivate,
}: CollectionSeriesCardProps) {
  const [isOver, setIsOver] = useState(false);

  return (
    <article
      className={`${styles.card} ${isOver ? styles.dragOver : ''} ${activeSerieIndex === serieIndex ? styles.active : ''}`}
      draggable
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate();
        }
      }}
      tabIndex={0}
      aria-label={`Série ${serie.name}, posição ${serie.position}`}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', String(serie.id));
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={async (event) => {
        event.preventDefault();
        const sourceId = Number(event.dataTransfer.getData('text/plain'));
        setIsOver(false);
        await onDropOnCard(sourceId, serie.id);
      }}
    >
      <img src={serie.coverImage} alt={serie.name} className={styles.cover} />

      <div className={styles.content}>
        <h3>
          <GripVertical size={16} /> {serie.position}. {serie.name}
        </h3>
        <p>{serie.description || 'Descrição ainda não disponível.'}</p>
      </div>
    </article>
  );
}
