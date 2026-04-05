import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

import styles from './PageControl.module.scss';
import { PageControlProps } from '../../types/components.interfaces';
import useSettingsStore from '../../store/useSettingsStore';

export default function PageControl({
  currentPage,
  TamPages,
  nextPage,
  prevPage,
  goToPage,
  percent,
  chapterLabel,
}: PageControlProps) {
  const [progress, setProgress] = useState(currentPage / TamPages);
  const readingMode = useSettingsStore((state) => state.settings.viewer.readingMode);
  const step = readingMode === 'double' ? 2 : 1;

  useEffect(() => {
    setProgress(currentPage / TamPages);
  }, [currentPage, TamPages]);

  const handleNextPage = () => {
    nextPage();
  };

  const handlePrevPage = () => {
    prevPage();
  };

  return (
    <div
      className={styles.secondInfo}
      style={{ '--progress': `${progress}` } as React.CSSProperties}
    >
      <ChevronLeft onClick={handlePrevPage} />
      <div className={styles.pageProgress}>
        {percent !== undefined && percent >= 0 ? (
          <div className={styles.epubProgress}>
            {chapterLabel && <span className={styles.chapterLabel}>{chapterLabel}</span>}
            <span className={styles.percent}>{percent}%</span>
          </div>
        ) : percent === -1 ? (
          <span className={styles.percent}>...</span>
        ) : (
          <p>
            {readingMode === 'double'
              ? `${currentPage + 1}-${Math.min(currentPage + 2, TamPages)}`
              : currentPage + 1}
          </p>
        )}
        <input
          type="range"
          min={0}
          max={TamPages - 1}
          step={step}
          value={currentPage}
          onChange={(e) => {
            const newPage = Number(e.target.value);
            if (newPage !== currentPage) {
              if (goToPage) {
                goToPage(newPage);
              }
            }
          }}
          className={styles.rangeSlider}
        />
        <p>{TamPages}</p>
      </div>
      <ChevronRight onClick={handleNextPage} />
    </div>
  );
}
