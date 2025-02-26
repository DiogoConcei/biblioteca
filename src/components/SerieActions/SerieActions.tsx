import { IoBookmarkOutline, IoBookmark } from "react-icons/io5";
import { FaBookOpen } from "react-icons/fa";
import { SerieCollectionInfo } from "../../types/collections.interfaces";
import { ComicActionsProps } from "../../types/components.interfaces";
import DownloadButton from "../DonwloadButton/DownloadButton";
import Rating from "../Rating/Rating";
import { useNavigate } from "react-router-dom";
import "./SerieActions.css";
import CollectionButton from "../CollectionButton/CollectionButton";

export default function SerieActions({
  manga,
  setManga,
  setfavCollection,
}: ComicActionsProps) {
  const navigate = useNavigate();

  const updateFavCollection = (favoriteStatus: boolean) => {
    const newSerie: SerieCollectionInfo = {
      id: manga.id,
      name: manga.name,
      coverImage: manga.coverImage,
      comic_path: manga.chaptersPath,
      archivesPath: manga.archivesPath,
      totalChapters: manga.totalChapters,
      status: manga.metadata.status,
      recommendedBy: manga.metadata.recommendedBy,
      originalOwner: manga.metadata.originalOwner,
      rating: manga.metadata.rating,
    };

    if (favoriteStatus) {
      setfavCollection((prevSerie) => ({
        ...prevSerie,
        series: [...prevSerie.series, newSerie],
      }));
    } else {
      setfavCollection((prevSerie) => ({
        ...prevSerie,
        series: prevSerie.series.filter((serie) => serie.name !== manga.name),
      }));
    }
  };

  const favorite = async (isFavorite: boolean) => {
    const newFavoriteStatus = !isFavorite;

    setManga((prevSerie) => ({
      ...prevSerie!,
      metadata: {
        ...prevSerie!.metadata,
        isFavorite: newFavoriteStatus,
      },
    }));

    try {
      const response = await window.electron.userAction.favoriteSerie(
        manga.dataPath
      );

      if (!response.success) {
        updateFavCollection(isFavorite);
        setManga((prevSerie) => ({
          ...prevSerie!,
          metadata: {
            ...prevSerie!.metadata,
            isFavorite: isFavorite,
          },
        }));
        throw new Error("Falha na operação");
      } else {
        updateFavCollection(newFavoriteStatus);
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
    }
  };

  const lastRead = async (
    event: React.MouseEvent<HTMLButtonElement>,
    dataPath: string
  ) => {
    event.preventDefault();
    const lastChapterUrl = await window.electron.chapters.acessLastRead(
      dataPath
    );
    navigate(lastChapterUrl, { state: { dataPath } });
  };

  return (
    <div className="serieActions">
      <DownloadButton
        manga={manga}
        setManga={setManga}
        dataPath={manga.dataPath}
      />
      <button
        className="favorite"
        onClick={(event) => favorite(manga.metadata.isFavorite)}>
        {manga.metadata.isFavorite ? <IoBookmark /> : <IoBookmarkOutline />}
        Favoritar
      </button>
      <CollectionButton dataPath={manga.dataPath} />
      <button
        className="reading"
        onClick={(event) => lastRead(event, manga.dataPath)}>
        <FaBookOpen />
        Continuar
      </button>
      <Rating manga={manga} />
    </div>
  );
}
