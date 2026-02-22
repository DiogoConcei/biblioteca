import { Star, StarOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { RatingProps } from '@/types/components.interfaces';
import useAction from '../../hooks/useAction';
import useClickOutside from '../../hooks/useClickOutside';
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

  const [isOpen, setIsOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState(
    serie.metadata.rating ?? 0,
  );
  const containerRef = useClickOutside<HTMLDivElement>(
    () => setIsOpen(false),
    isOpen,
  );

  useEffect(() => {
    setCurrentRating(serie.metadata.rating ?? 0);
  }, [serie.metadata.rating]);

  const handleNewRating = async (event: React.MouseEvent, rating: number) => {
    await ratingSerie(event, serie, rating);
    setCurrentRating(rating);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef}>
      <button
        className={styles.rating}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label="Selecionar rating"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {currentRating > 0 ? <Star /> : <StarOff />}
      </button>

      {isOpen && (
        <ul className={styles['rating-list']} role="menu">
          {STARS_RATING.map((option) => (
            <li
              key={option.value}
              className={styles['rating-item']}
              role="none"
            >
              <button
                className={styles['rating-option']}
                role="menuitemradio"
                aria-checked={currentRating === option.value}
                onClick={(event) => handleNewRating(event, option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
