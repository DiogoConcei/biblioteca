import { useEffect } from 'react';
import styles from './WebtoonView.module.scss';

interface WebtoonViewProps {
  pages: string[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  nextChapter: () => void;
  getFilteredUrl: (url: string) => string;
  isWide?: boolean;
}

export default function WebtoonView({
  pages,
  currentPage,
  setCurrentPage,
  nextChapter,
  getFilteredUrl,
  isWide = false,
}: WebtoonViewProps) {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3, // 30% da página visível para disparar
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageIndex = Number(entry.target.getAttribute('data-page-index'));
          if (!isNaN(pageIndex) && pageIndex !== currentPage) {
            setCurrentPage(pageIndex);
          }
        }
      });
    }, observerOptions);

    // Observa todas as imagens do modo vertical
    const images = document.querySelectorAll(`.${styles.verticalPage}`);
    images.forEach((img) => observer.observe(img));

    return () => observer.disconnect();
  }, [pages, currentPage, setCurrentPage]);

  return (
    <div className={styles.verticalContainer}>
      {pages.map((page: string, index: number) => (
        <img
          key={index}
          data-page-index={index}
          src={getFilteredUrl(page)}
          alt={`Página ${index + 1}`}
          className={`${styles.verticalPage} ${isWide ? styles.wide : ''}`}
          loading="lazy"
          decoding="async"
        />
      ))}
      <div className={styles.verticalEnd}>
        <button onClick={nextChapter}>Próximo Capítulo</button>
      </div>
    </div>
  );
}
