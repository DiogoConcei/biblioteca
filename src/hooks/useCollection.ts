import { useEffect } from 'react';

import { useCollectionStore } from '../store/useCollectionStore';
import Favorite from '@/components/FavoriteButton/Favorite';

export default function useCollection() {
  const {
    collections,
    favorites,
    recents,
    setFav,
    fetchCollections,
    updateFav,
    createCollection,
    updateCollection,
    deleteCollection,
    removeSerie,
    reorderSeries,
  } = useCollectionStore();

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    favorites,
    recents,
    updateFav,
    setFav,
    createCollection,
    updateCollection,
    deleteCollection,
    removeSerie,
    reorderSeries,
  };
}
