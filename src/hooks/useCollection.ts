import { useEffect, useState } from 'react';
import useUIStore from '../store/useUIStore';
import {
  Collection,
  SerieCollectionInfo,
} from '../types/collections.interfaces';
import { Literatures } from '../types/auxiliar.interfaces';

export default function useCollection() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [favorites, setFavorites] = useState<Collection>();
  const [recents, setRecents] = useState<Collection>();
  const setError = useUIStore((state) => state.setError);

  useEffect(() => {
    async function getCollections() {
      try {
        const response = await window.electronAPI.collections.getCollections();

        if (!response.success || !response.data) {
          setError('Falha na requisição');
          return;
        }

        const data = response.data;
        const collNames = data.map((col: Collection) => col.name);

        setCollections(response.data);
        setFavorites(
          response.data.find((coll: Collection) => coll.name === 'Favoritas'),
        );
        setRecents(
          response.data.find((coll: Collection) => coll.name === 'Recentes'),
        );
      } catch (e) {
        setError('Falha ao coletar todas as coleções');
      }
    }

    getCollections();
  }, []);

  const updateFav = async (
    serie: Literatures,
    isFav: boolean,
  ): Promise<boolean> => {
    try {
      const response = await window.electronAPI.series.favoriteSerie(
        serie.dataPath,
      );
      if (!response.success) return false;

      const dataAtual = Date.now();

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
        addAt: dataAtual,
      };

      setFavorites((prev) => {
        if (!prev) return prev;

        const updatedSeries = isFav
          ? [...prev.series, serieInfo]
          : prev.series.filter((s) => s.id !== serie.id);

        return {
          ...prev,
          series: updatedSeries,
        };
      });

      return true;
    } catch (error) {
      console.error(
        `Erro ao atualizar favorito da série "${serie.name}":`,
        error,
      );
      return false;
    }
  };

  const addToCollection = async (
    _e: React.MouseEvent<HTMLButtonElement>,
    collectionName: string,
    dataPath: string,
  ) => {
    try {
      await window.electronAPI.series.serieToCollection(
        dataPath,
        collectionName,
      );
    } catch (error) {
      console.error(
        `Erro ao adicionar série à coleção "${collectionName}":`,
        error,
      );
    }
  };

  return {
    favorites,
    collections,
    setFavorites,
    updateFav,
    addToCollection,
  };
}
