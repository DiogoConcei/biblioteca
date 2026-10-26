import { useEffect } from 'react';

import { useCollectionStore } from '../store/useCollectionStore';

export default function useCollection() {
  const collections = useCollectionStore((s) => s.collections);
  const favorites = useCollectionStore((s) => s.favorites);
  const setFav = useCollectionStore((s) => s.setFav);
  const updateFav = useCollectionStore((s) => s.updateFav);
  const fetchCollections = useCollectionStore((s) => s.fetchCollections);
  const addToCollection = useCollectionStore((s) => s.addToCollection);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return { collections, favorites, setFav, updateFav, addToCollection };
}
