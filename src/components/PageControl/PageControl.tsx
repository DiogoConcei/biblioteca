import "./PageControl.scss";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { PageControlProps } from "../../types/components.interfaces";

export default function PageControl({
  currentPage,
  TamPages,
  nextPage,
  prevPage,
}: PageControlProps) {
  const [progress, setProgress] = useState(currentPage / TamPages);

  useEffect(() => {
    setProgress(currentPage / TamPages);
  }, [currentPage, TamPages]);

  const handleNextPage = () => {
    nextPage();
    const newPage = currentPage + 1;
    setProgress(newPage / TamPages);
  };

  const handlePrevPage = () => {
    prevPage();
    const newPage = currentPage - 1;
    setProgress(newPage / TamPages);
  };

  return (
    <div
      className="secondInfo"
      style={{ "--progress": `${progress}` } as React.CSSProperties}
    >
      <ChevronLeft onClick={handlePrevPage} />
      <div className="pageProgress">
        <p>{currentPage}</p>
        <input
          type="range"
          min={0}
          max={TamPages}
          value={currentPage}
          onChange={(e) => {
            const newPage = Number(e.target.value);
            if (newPage !== currentPage) {
              const diff = newPage - currentPage;
              if (diff > 0) nextPage();
              else prevPage();
            }
          }}
          className="rangeSlider"
        />
        <p>{TamPages}</p>
      </div>
      <ChevronRight onClick={handleNextPage} />
    </div>
  );
}
