import { Star } from 'lucide-react';
import { useState } from 'react';
import { RatingProps } from '@/shared/types/components.interfaces';
import useAction from '@/shared/hooks/useAction';

import styles from './Rating.module.scss';

const STARS_RATING = [
  { value: 1, label: '1 - Péssimo' },
  { value: 2, label: '2 - Horrível' },
  { value: 3, label: '3 - Regular' },
  { value: 4, label: '4 - Bom' },
  { value: 5, label: '5 - Excelente' },
];

export default function Rating({ serie }: RatingProps) {
  const { ratingSerie } = useAction();
  const [hovered, setHovered] = useState(0);

  const rating = serie.metadata.rating ?? 0;
  const shown = hovered || rating;
  const shownLabel = STARS_RATING.find((o) => o.value === shown)?.label ?? 'Sem nota';

  return (
    <div
      className={styles.rating}
      role="group"
      aria-label="Nota da série"
      onMouseLeave={() => setHovered(0)}
    >
      <div className={styles.stars}>
        {STARS_RATING.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.star}
            data-filled={option.value <= shown}
            aria-label={option.label}
            aria-pressed={option.value === rating}
            title={option.value === rating ? 'Remover nota' : option.label}
            onMouseEnter={() => setHovered(option.value)}
            onFocus={() => setHovered(option.value)}
            onBlur={() => setHovered(0)}
            onClick={(event) =>
              ratingSerie(event, serie, option.value === rating ? 0 : option.value)
            }
          >
            <Star size={22} fill={option.value <= shown ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <span className={styles.label} aria-live="polite">
        {shownLabel}
      </span>
    </div>
  );
}
