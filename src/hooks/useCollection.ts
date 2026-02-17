import { useEffect } from 'react';
import { useCollectionStore } from '../store/useCollectionStore';

export default function useCollection() {
  const { collections, favorites, recents, fetchCollections, updateFav } =
    useCollectionStore();

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    favorites,
    recents,
    updateFav,
  };
}
