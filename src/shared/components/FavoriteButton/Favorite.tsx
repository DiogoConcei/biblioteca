import { Bookmark, BookmarkCheck } from 'lucide-react';
import { FavoriteProps } from '@/shared/types/components.interfaces';
import useAction from '@/shared/hooks/useAction';
import styles from './Favorite.module.scss';

export default function Favorite({ serie }: FavoriteProps) {
  const { favoriteSerie } = useAction();

  return (
    <button
      className={styles.favorite}
      onClick={() => favoriteSerie(serie.metadata.isFavorite)}
    >
      {serie.metadata.isFavorite ? <BookmarkCheck /> : <Bookmark />}
      Favoritar
    </button>
  );
}
