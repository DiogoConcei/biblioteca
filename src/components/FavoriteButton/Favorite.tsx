import { Bookmark, BookmarkCheck } from 'lucide-react';
import useCollection from '../../hooks/useCollection';
import { FavoriteProps } from '../../../electron/types/electron-auxiliar.interfaces';
import styles from './Favorite.module.scss';
import useSerieStore from '../../store/useSerieStore';

export default function Favorite({ serie }: FavoriteProps) {
  const { updateFav } = useCollection();
  const updateSerie = useSerieStore((state) => state.updateSerie);

  const favoriteSerie = async (isFav: boolean) => {
    const newFavoriteStatus = !isFav;
    updateSerie('metadata.isFavorite', newFavoriteStatus);

    const response = await updateFav(serie, newFavoriteStatus);

    if (!response) {
      updateSerie('metadata.isFavorite', isFav);
    }
  };

  return (
    <button
      className={styles.favorite}
      onClick={() => favoriteSerie(serie.metadata.isFavorite)}
    >
      {serie.metadata.isFavorite ? <Bookmark /> : <BookmarkCheck />}
      Favoritar
    </button>
  );
}
