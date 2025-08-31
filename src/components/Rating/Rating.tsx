import { StarOff, Star } from 'lucide-react';
import { useState } from 'react';
import useAction from '../../hooks/useAction';
import useCollection from '../../hooks/useCollection';
import { RatingProps } from '../../types/auxiliar.interfaces';
import styles from './Rating.module.scss';

export default function Rating({ serie }: RatingProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { ratingSerie } = useAction(serie.dataPath);
  const { setFavorites } = useCollection();

  const [currentRating, setCurrentRating] = useState<number>(
    serie.metadata.rating !== undefined ? serie.metadata.rating + 1 : 0,
  );

  const starsRating = [
    '1 - Péssimo',
    '2 - Horrível',
    '3 - Regular',
    '4 - Bom',
    '5 - Excelente',
  ];

  const newRating = async (index: number) => {
    ratingSerie(serie.dataPath, index);

    setFavorites((prev) => {
      if (!prev) return prev;

      const updatedSeries = prev.series.map((serie) => {
        if (serie.name === serie.name) {
          return {
            ...serie,
            rating: index,
          };
        }
        return serie;
      });

      return {
        ...prev,
        series: updatedSeries,
      };
    });

    setCurrentRating(index);
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
                onClick={async () => await newRating(index)}
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
