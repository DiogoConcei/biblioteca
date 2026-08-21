import { LoaderCircle } from 'lucide-react';
import styles from './SinglePageView.module.scss';

interface SinglePageViewProps {
  page: string;
  currentPage: number;
  getFilteredUrl: (url: string) => string;
  scale: number;
  position: { x: number; y: number };
  elementRef: React.RefObject<HTMLImageElement>;
  transitionEffect: string;
  isLoading: boolean;
  isWide?: boolean;
}

export default function SinglePageView({
  page,
  currentPage,
  getFilteredUrl,
  scale,
  position,
  elementRef,
  transitionEffect,
  isLoading,
  isWide = false,
}: SinglePageViewProps) {
  return (
    <div className={`${styles.containerPage} ${isWide ? styles.wide : ''}`}>
      <img
        key={currentPage} // Força re-render para animação de transição
        className={`${styles.chapterPage} ${styles[transitionEffect] || ''}`}
        draggable={false}
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
        }}
        ref={elementRef}
        src={getFilteredUrl(page)}
        alt={`Página ${currentPage + 1}`}
      />
      {isLoading && <LoaderCircle className={styles.spinner} />}
    </div>
  );
}
