import { viewData } from '@/../electron/types/electron-auxiliar.interfaces';
import styles from './SeriesView.module.scss';

interface SeriesViewProps {
  series: viewData[];
  title?: string;
  onSelect?: (serie: viewData) => void;
  selectedId?: number;
}

export default function SeriesView({
  series,
  title,
  onSelect,
  selectedId,
}: SeriesViewProps) {
  return (
    <div className={styles.seriesContainer}>
      {title && <h2 className={styles.seriesTitle}>{title}</h2>}

      {series.length > 0 ? (
        <div className={styles.coverGrid}>
          {series.map((serie) => {
            const isSelected = selectedId === serie.id;
            return (
              <div
                key={serie.id}
                className={`${styles.coverItem} ${onSelect ? styles.clickable : ''} ${isSelected ? styles.selected : ''}`}
                onClick={() => onSelect?.(serie)}
              >
                <img src={serie.coverImage} alt={serie.name} title={serie.name} />
                <span className={styles.coverLabel}>{serie.name}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.emptyMessage}>Nenhuma série encontrada.</p>
      )}
    </div>
  );
}
