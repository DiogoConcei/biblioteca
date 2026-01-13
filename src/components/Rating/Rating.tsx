import { StarOff, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import useAction from '../../hooks/useAction';
import useCollection from '../../hooks/useCollection';
import { RatingProps } from '../../../electron/types/electron-auxiliar.interfaces';
import styles from './Rating.module.scss';

export default function Rating({ serie }: RatingProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { ratingSerie } = useAction();
  const { setFavorites } = useCollection();

  useEffect(() => {
    if (!serie) return;
    const value = serie.metadata.rating;

    if (!value) return;

    setCurrentRating(value);
  }, []);

  const [currentRating, setCurrentRating] = useState<number>(0);

  const starsRating = [
    '1 - Péssimo',
    '2 - Horrível',
    '3 - Regular',
    '4 - Bom',
    '5 - Excelente',
  ];

  const newRating = async (e: React.MouseEvent, rating: number) => {
    ratingSerie(e, serie, rating);

    setFavorites((prev) => {
      if (!prev) return prev;

      const updatedSeries = prev.series.map((serie) => {
        if (serie.name === serie.name) {
          return {
            ...serie,
            rating: rating,
          };
        }
        return serie;
      });

      return {
        ...prev,
        series: updatedSeries,
      };
    });

    setCurrentRating(rating);
  };

  const onToggle = () => {
    setIsOpen(!isOpen);
    setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  };

  return (
    <div>
      <button className={styles.rating} onClick={onToggle}>
        {currentRating > 0 ? <Star /> : <StarOff />}
      </button>

      {isOpen && (
        <ul className={styles['rating-list']}>
          {starsRating.map((quantity, index) => (
            <li key={index} className={styles['rating-item']}>
              <button
                className={styles['rating-option']}
                onClick={async (e) => newRating(e, index)}
              >
                {quantity}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
