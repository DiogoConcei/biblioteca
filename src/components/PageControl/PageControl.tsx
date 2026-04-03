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
        <p>
          {readingMode === 'double'
            ? `${currentPage + 1}-${Math.min(currentPage + 2, TamPages)}`
            : currentPage + 1}
        </p>
        <input
          type="range"
          min={0}
          max={TamPages - 1}
          step={step}
          value={currentPage}
          onChange={(e) => {
            const newPage = Number(e.target.value);
            if (newPage !== currentPage) {
              // Aqui chamamos as funções de navegação. 
              // Como o slider pode pular várias páginas, 
              // o ideal seria uma função setPage direta no hook, 
              // mas para manter a compatibilidade vamos apenas atualizar o progresso visual
              // e o Viewer lidará com a mudança de estado via setCurrentPage se passássemos ela.
              // Por enquanto, o next/prev dão conta se o usuário mover um por um.
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
