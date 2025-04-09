import { useEffect, useState } from "react";
import {
  Collection,
  SerieCollectionInfo,
} from "../types/collections.interfaces";
import { Literatures } from "../types/series.interfaces";

export default function useCollection() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [favCollection, setFavCollection] = useState<Collection | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const collectionsData =
          await window.electron.collections.getCollections();
        const favSeries = await window.electron.collections.getFavSeries();
        setFavCollection(favSeries);
        setCollections(collectionsData);
      } catch (error) {
        console.error("Erro ao carregar as coleções:", error);
      }
    })();
  }, []);

  const updateFav = async (
    serie: Literatures,
    isFav: boolean
  ): Promise<boolean> => {
    try {
      const response = await window.electron.userAction.favoriteSerie(
        serie.dataPath
      );

      if (!response.success) return response.success;

      const newSerie: SerieCollectionInfo = {
        id: serie.id,
        name: serie.name,
        coverImage: serie.coverImage,
        comic_path: serie.chaptersPath,
        archivesPath: serie.archivesPath,
        totalChapters: serie.totalChapters,
        status: serie.metadata.status,
        recommendedBy: serie.metadata.recommendedBy,
        originalOwner: serie.metadata.originalOwner,
        rating: serie.metadata.rating,
      };

      if (isFav) {
        setFavCollection((prevSerie) => ({
          ...prevSerie,
          series: [...prevSerie.series, newSerie],
        }));
      } else {
        setFavCollection((prevSerie) => ({
          ...prevSerie,
          series: prevSerie.series.filter((serie) => serie.name !== serie.name),
        }));
      }

      return response.success;
    } catch (e) {
      console.error("Erro ao favoritar série:", serie.name);
    }
  };

  const addToCollection = async (
    e: React.MouseEvent<HTMLButtonElement>,
    collectionName: string,
    dataPath: string
  ) => {
    await window.electron.collections.serieToCollection(dataPath);
  };

  return { favCollection, collections, updateFav, addToCollection };
}
