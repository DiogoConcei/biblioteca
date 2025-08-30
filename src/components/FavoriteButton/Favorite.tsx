import { Bookmark, BookmarkCheck } from 'lucide-react';
import useCollection from '../../hooks/useCollection';
import useSerie from '../../hooks/useSerie';
import { FavoriteProps } from '../../types/auxiliar.interfaces';
import './Favorite.scss';

export default function Favorite({ serie }: FavoriteProps) {
  const { updateFav } = useCollection();
  const { updateSerie } = useSerie('', 'Manga');

  const favoriteSerie = async (isFav: boolean) => {
    const newFavoriteStatus = !isFav;
    updateSerie('metadata.isFavorite', newFavoriteStatus);

    const response = updateFav(serie, newFavoriteStatus);

    if (!response) {
      updateSerie('metadata.isFavorite', isFav);
    }
  };

  return (
    <button
      className="favorite"
      onClick={() => favoriteSerie(serie.metadata.isFavorite)}
    >
      {serie.metadata.isFavorite ? <Bookmark /> : <BookmarkCheck />}
      Favoritar
    </button>
  );
}
