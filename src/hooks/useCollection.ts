import { useEffect } from 'react';

import { useCollectionStore } from '../store/useCollectionStore';

export default function useCollection() {
  const {
    collections,
    favorites,
    recents,
    setFav,
    fetchCollections,
    updateFav,
    createCollection,
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
  };
}
