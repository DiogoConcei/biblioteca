import { useEffect, useMemo } from 'react';

import { useCollectionStore } from '../store/useCollectionStore';

// useCollection.ts
export default function useCollection() {
  const collections = useCollectionStore((s) => s.collections);
  const updateFav = useCollectionStore((s) => s.updateFav);
  const fetchCollections = useCollectionStore((s) => s.fetchCollections);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const favorites = useMemo(
    () => collections.find((c) => c.name.trim().toLowerCase() === 'favoritos') ?? null,
    [collections],
  );
  const recents = useMemo(
    () => collections.find((c) => c.name.trim().toLowerCase() === 'recentes') ?? null,
    [collections],
  );

  return { collections, favorites, recents, updateFav, fetchCollections };
}
