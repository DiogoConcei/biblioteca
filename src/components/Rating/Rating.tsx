import useAction from "../../hooks/useAction";
import { IoMdStar, IoIosStarOutline } from "react-icons/io";
import { useState } from "react";
import { OnlySerieProp } from "../../types/components.interfaces";
import "./Rating.css";

export default function Rating({ manga }: OnlySerieProp) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { ratingSerie } = useAction({ dataPath: manga.dataPath });
  const [selectedRating, setSelectedRating] = useState<number>(
    manga.metadata.rating
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
    setTimeout(() => {
      setIsOpen(false);
    }, 1000);
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
              <button
                className="rating-option"
                onClick={() => ratingSerie(manga.dataPath, index)}
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
