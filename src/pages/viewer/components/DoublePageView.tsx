import styles from './DoublePageView.module.scss';

interface DoublePageViewProps {
  pages: string[];
  currentPage: number;
  getFilteredUrl: (url: string) => string;
}

export default function DoublePageView({
  pages,
  currentPage,
  getFilteredUrl,
}: DoublePageViewProps) {
  const secondPageIdx = currentPage + 1;
  const hasSecondPage = secondPageIdx < pages.length;

  return (
    <div className={styles.doublePageContainer}>
      <div className={styles.doublePageWrapper}>
        <img
          className={styles.doublePageImage}
          src={getFilteredUrl(pages[currentPage])}
          alt="página esquerda"
        />
        {hasSecondPage && (
          <img
            className={styles.doublePageImage}
            src={getFilteredUrl(pages[secondPageIdx])}
            alt="página direita"
          />
        )}
      </div>
    </div>
  );
}
