import { useState } from "react";
import { HiDownload } from "react-icons/hi";

import useDownload from "../../hooks/useDownload";
import useSerie from "../../hooks/useSerie";

import { downloadButtonProps } from "../../types/components.interfaces";

import "./DownloadButton.css";

export default function DownloadButton({
  serie,
  updateSerie,
}: downloadButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { updateChapters } = useSerie(serie.name);
  const { downloadMultipleChapters: downloadChapters } = useDownload({
    setError,
  });

  const options = [1, 5, 10, 20, 25];

  const onToggle = () => {
    setIsOpen((prevState) => !prevState);
  };

  const onSelect = async (quantity: number) => {
    setSelectedQuantity(quantity);

    if (quantity > 0) {
      const startIndex = serie.metadata.lastDownload;
      const endIndex = startIndex + quantity;
      let chapters: string[] = [];

      for (let i = startIndex; i < endIndex; i++) {
        const path = `chapters.${i}.isDownload`;
        chapters.push(path);
      }

      updateChapters(chapters, true);
      const response = await downloadChapters(serie.dataPath, quantity);

      if (!response) {
        updateChapters(chapters, false);
        setError("Falha ao baixar capítulos");
      }

      setIsOpen(false);
    }
  };

  return (
    <div className="dropdown-container">
      <button className={`download ${isOpen ? "open" : ""}`} onClick={onToggle}>
        <HiDownload className="download-icon" />
        Download
      </button>

      {isOpen && (
        <ul className="dropdown-list">
          {options.map((quantity) => (
            <li key={quantity} className="dropdown-item">
              <button
                className="dropdown-option"
                onClick={() => onSelect(quantity)}
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
