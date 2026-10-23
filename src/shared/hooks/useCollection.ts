import { useEffect } from 'react';

import { useCollectionStore } from '../store/useCollectionStore';

export default function useCollection() {
  const collections = useCollectionStore((s) => s.collections);
  const favorites = useCollectionStore((s) => s.favorites);
  const recents = useCollectionStore((s) => s.recents);
  const setFav = useCollectionStore((s) => s.setFav);
  const updateFav = useCollectionStore((s) => s.updateFav);
  const fetchCollections = useCollectionStore((s) => s.fetchCollections);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return { collections, favorites, recents, setFav, updateFav };
}
