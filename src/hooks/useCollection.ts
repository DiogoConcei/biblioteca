import { useEffect, useState } from 'react';

import { Collection, SerieCollectionInfo } from '../types/collections.interfaces';
import { Literatures } from '../types/series.interfaces';

export default function useCollection() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [favCollection, setFavCollection] = useState<Collection | null>(null);

  useEffect(() => {
    async function loadCollections() {
      try {
        const [allCollections, favoriteCollection] = await Promise.all([
          window.electronAPI.collections.getCollections(),
          window.electronAPI.collections.getFavSeries(),
        ]);

        setCollections(allCollections.data ?? []);
        setFavCollection(favoriteCollection.data);
      } catch (error) {
        console.error('Erro ao carregar as coleções:', error);
      }
    }

    loadCollections();
  }, []);

  const updateFav = async (serie: Literatures, isFav: boolean): Promise<boolean> => {
    try {
      const response = await window.electronAPI.series.favoriteSerie(serie.dataPath);
      if (!response.success) return false;

      const serieInfo: SerieCollectionInfo = {
        id: serie.id,
        name: serie.name,
        coverImage: serie.coverImage,
        comic_path: serie.chaptersPath,
        archivesPath: serie.archivesPath,
        totalChapters: serie.totalChapters,
        status: serie.metadata.status,
        recommendedBy: serie.metadata.recommendedBy ?? '',
        originalOwner: serie.metadata.originalOwner ?? '',
        rating: serie.metadata.rating ?? 0,
      };

      setFavCollection(prev => {
        if (!prev) return prev;

        const updatedSeries = isFav
          ? [...prev.series, serieInfo]
          : prev.series.filter(s => s.id !== serie.id);

        return {
          ...prev,
          series: updatedSeries,
        };
      });

      return true;
    } catch (error) {
      console.error(`Erro ao atualizar favorito da série "${serie.name}":`, error);
      return false;
    }
  };

  const addToCollection = async (
    _e: React.MouseEvent<HTMLButtonElement>,
    collectionName: string,
    dataPath: string,
  ) => {
    try {
      await window.electronAPI.series.serieToCollection(dataPath);
    } catch (error) {
      console.error(`Erro ao adicionar série à coleção "${collectionName}":`, error);
    }
  };

  return {
    favCollection,
    collections,
    updateFav,
    addToCollection,
  };
}
