import { FaStar } from 'react-icons/fa';
import useAction from '@/shared/hooks/useAction';
import styles from './QuicklyFavorite.module.scss';

export default function QuicklyFavorite({ isFavorite }: { isFavorite: boolean }) {
  const { favoriteSerie } = useAction();

  return (
    <button className={styles.favorite} onClick={() => favoriteSerie(isFavorite)}>
      {isFavorite ? <FaStar /> : <FaStar />}
    </button>
  );
}
