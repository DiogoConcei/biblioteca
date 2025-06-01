import { StarOff, Star } from 'lucide-react';
import { useState } from 'react';

import useAction from '../../hooks/useAction';
import { OnlySerieProp } from '../../types/components.interfaces';
import './Rating.scss';

export default function Rating({ manga }: OnlySerieProp) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { ratingSerie } = useAction({ dataPath: manga.dataPath });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedRating, setSelectedRating] = useState<number>(manga.metadata.rating!);

  const starsRating = ['1 - Péssimo', '2 - Horrível', '3 - Regular', '4 - Bom', '5 - Excelente'];

  const onToggle = () => {
    setIsOpen(!isOpen);
    setTimeout(() => {
      setIsOpen(false);
    }, 50000);
  };

  return (
    <div>
      <button className="rating" onClick={onToggle}>
        {selectedRating > 0 ? <Star /> : <StarOff />}
      </button>

      {isOpen && (
        <ul className="rating-list">
          {starsRating.map((quantity, index) => (
            <li key={index} className="rating-item">
              <button className="rating-option" onClick={() => ratingSerie(manga.dataPath, index)}>
                {quantity}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
