import { StarOff, Star } from "lucide-react";
import { useState } from "react";

import useAction from "../../hooks/useAction";
import "./Rating.scss";
import { Literatures } from "../../types/series.interfaces";
import useCollection from "../../hooks/useCollection";

interface RatingProps {
  manga: Literatures;
}

export default function Rating({ manga }: RatingProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { ratingSerie } = useAction(manga.dataPath);
  const { setFavorites } = useCollection();

  // Não tão legal assim, mas ok por enquanto
  const [currentRating, setCurrentRating] = useState<number>(
    manga.metadata.rating !== undefined ? manga.metadata.rating + 1 : 0
  );

  const starsRating = [
    "1 - Péssimo",
    "2 - Horrível",
    "3 - Regular",
    "4 - Bom",
    "5 - Excelente",
  ];

  const newRating = async (index: number) => {
    ratingSerie(manga.dataPath, index);

    setFavorites((prev) => {
      if (!prev) return prev;

      const updatedSeries = prev.series.map((serie) => {
        if (serie.name === manga.name) {
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
      <button className="rating" onClick={onToggle}>
        {currentRating > 0 ? <Star /> : <StarOff />}
      </button>

      {isOpen && (
        <ul className="rating-list">
          {starsRating.map((quantity, index) => (
            <li key={index} className="rating-item">
              <button
                className="rating-option"
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
