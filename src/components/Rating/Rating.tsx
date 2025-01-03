import { IoMdStar, IoIosStarOutline } from "react-icons/io";
import { useState } from "react";
import { OnlySerieProp } from "../../types/components.interfaces";
import "./Rating.css";

export default function Rating({ serie }: OnlySerieProp) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedRating, setSelectedRating] = useState<string>("");

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

  const onSelect = (rating: string) => {
    setSelectedRating(rating);
    setIsOpen(false);
  };

  return (
    <div>
      <button className="rating" onClick={onToggle}>
        {selectedRating ? <IoMdStar /> : <IoIosStarOutline />}
      </button>

      {isOpen && (
        <ul className="rating-list">
          {starsRating.map((quantity, index) => (
            <li key={index} className="rating-item">
              <button
                className="rating-option"
                onClick={() => onSelect(quantity)}>
                {quantity}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
