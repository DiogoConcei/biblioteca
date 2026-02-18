import { Star, StarOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { RatingProps } from '../../../electron/types/electron-auxiliar.interfaces';
import useAction from '../../hooks/useAction';
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState(
    serie.metadata.rating ?? 0,
  );

  useEffect(() => {
    setCurrentRating(serie.metadata.rating ?? 0);
  }, [serie.metadata.rating]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
      >
        {currentRating > 0 ? <Star /> : <StarOff />}
      </button>

      {isOpen && (
        <ul className={styles['rating-list']}>
          {STARS_RATING.map((option) => (
            <li key={option.value} className={styles['rating-item']}>
              <button
                className={styles['rating-option']}
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
