import { useState } from "react";
import { downloadButtonProps } from "../../types/components.interfaces";
import { HiDownload } from "react-icons/hi";
import "./DownloadButton.css";
import { MangaChapter } from "../../types/manga.interfaces";

export default function DownloadButton({
  manga,
  setManga,
}: downloadButtonProps) {
  const [selectedQuantity, setSelectedQuantity] = useState<number>(0);
  const [chapters, setChapters] = useState<MangaChapter[]>(manga.chapters);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const options = [1, 5, 10, 20, 25];

  const onToggle = () => {
    setIsOpen((prevState) => !prevState);
  };

  const onSelect = async (quantity: number) => {
    setManga((prevManga) => {
      const startIndex = prevManga.metadata.lastDownload;

      const endIndex = Math.min(
        startIndex + quantity,
        prevManga.chapters.length
      );

      const updatedChapters = prevManga.chapters.map((chapter, index) =>
        index >= startIndex && index < endIndex
          ? { ...chapter, isDownload: true }
          : chapter
      );

      return {
        ...prevManga,
        chapters: updatedChapters,
        metadata: {
          ...prevManga.metadata,
          lastdownload: endIndex,
        },
      };
    });

    setSelectedQuantity(quantity);
    await window.electron.download.multipleDownload(manga.dataPath, quantity);
    setIsOpen(false);
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
