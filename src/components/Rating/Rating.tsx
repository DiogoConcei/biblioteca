import { IoMdStar, IoIosStarOutline } from "react-icons/io";
import { useState } from "react";
import { OnlySerieProp } from "../../types/components.interfaces";
import "./Rating.css";

export default function Rating({ serie }: OnlySerieProp) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedRating, setSelectedRating] = useState<number>(
    serie.metadata.rating
  );
  const [previousRating, setPreviousRating] = useState<number>(
    serie.metadata.rating
  );

  const starsRating = [
    "1 - Péssimo",
    "2 - Horrível",
    "3 - Regular",
    "4 - Bom",
    "5 - Excelente",
  ];

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = async (ratingIndex: number) => {
    const previousRatingValue = selectedRating;
    setPreviousRating(previousRatingValue);
    setSelectedRating(ratingIndex);

    try {
      await window.electron.serieActions.ratingSerie(serie.name, ratingIndex);
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar o rating:", error);
      throw error;
      setSelectedRating(previousRatingValue);
    }
  };

  return (
    <div>
      <button className="rating" onClick={onToggle}>
        {selectedRating > 0 ? <IoMdStar /> : <IoIosStarOutline />}
      </button>

      {isOpen && (
        <ul className="rating-list">
          {starsRating.map((quantity, index) => (
            <li key={index} className="rating-item">
              <button className="rating-option" onClick={() => onSelect(index)}>
                {quantity}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
