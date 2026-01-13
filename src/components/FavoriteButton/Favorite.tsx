import { Bookmark, BookmarkCheck } from 'lucide-react';
import useCollection from '../../hooks/useCollection';
import { FavoriteProps } from '../../../electron/types/electron-auxiliar.interfaces';
import styles from './Favorite.module.scss';
import { SerieCollectionInfo } from '../../types/collections.interfaces';
import useSerieStore from '../../store/useSerieStore';

export default function Favorite({ serie, setFavorites }: FavoriteProps) {
  const { updateFav } = useCollection();
  const updateSerie = useSerieStore((state) => state.updateSerie);

  const favoriteSerie = async (isFav: boolean) => {
    const newFavoriteStatus = !isFav;
    const dataAtual = Date.now();
    updateSerie('metadata.isFavorite', newFavoriteStatus);

    setFavorites((prev) => {
      if (!prev) return prev;

      const exists = prev.series.some((s) => s.id === serie.id);

      if (newFavoriteStatus) {
        if (!exists) {
          // Conversão explícita
          const converted: SerieCollectionInfo = {
            id: serie.id,
            name: serie.name,
            coverImage: serie.coverImage,
            comic_path: serie.chaptersPath,
            archivesPath: serie.archivesPath,
            totalChapters: serie.totalChapters,
            status: serie.metadata.status,
            recommendedBy: serie.metadata.recommendedBy || '',
            originalOwner: serie.metadata.originalOwner || '',
            rating: serie.metadata.rating || 0,
            addAt: dataAtual,
          };

          return {
            ...prev,
            series: [...prev.series, converted],
          };
        }

        return prev;
      }

      // remover dos favoritos
      if (exists) {
        return {
          ...prev,
          series: prev.series.filter((s) => s.id !== serie.id),
        };
      }

      return prev;
    });

    const response = updateFav(serie, newFavoriteStatus);

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
