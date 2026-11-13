import { useEffect, useRef, useState } from 'react';
import useClickOutside from '@/shared/hooks/useClickOutside';
import { Star } from 'lucide-react';

import { RatingProps } from '@/shared/types/components.interfaces';
import Rating from '@/shared/components/Rating/Rating';
import styles from './QuicklyRating.module.scss';

export default function QuicklyRating({ serie }: RatingProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);
  const rating = serie.metadata.rating ?? 0;
  const hasRating = rating > 0;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.root} ${hasRating ? styles.active : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={hasRating ? `Nota ${rating} de 5` : 'Avaliar série'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={hasRating ? `Nota: ${rating}/5` : 'Avaliar'}
      >
        <Star size={18} fill={hasRating ? 'currentColor' : 'none'} />
        {hasRating && <span className={styles.value}>{rating}</span>}
      </button>

      {isOpen && (
        <div className={styles.popover} role="dialog" aria-label="Avaliar série">
          <Rating serie={serie} />
        </div>
      )}
    </div>
  );
}
