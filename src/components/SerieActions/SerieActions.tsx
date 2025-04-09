import DownloadButton from "../DonwloadButton/DownloadButton";
import Rating from "../Rating/Rating";
import CollectionButton from "../CollectionButton/CollectionButton";
import { SerieActionProps } from "../../types/components.interfaces";
import { FaBookOpen } from "react-icons/fa";
import { IoBookmarkOutline, IoBookmark } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import "./SerieActions.css";

export default function SerieActions({
  manga,
  updateSerie,
  updateFavCollection,
}: SerieActionProps) {
  const navigate = useNavigate();

  const lastRead = async (
    event: React.MouseEvent<HTMLButtonElement>,
    dataPath: string
  ) => {
    event.preventDefault();
    const lastChapterUrl = await window.electron.chapters.acessLastRead(
      dataPath
    );
    navigate(lastChapterUrl);
  };

  const favoriteSerie = async (isFav: boolean) => {
    const newFavoriteStatus = !isFav;
    updateSerie("metadata.isFavorite", newFavoriteStatus);

    const response = updateFavCollection(manga, newFavoriteStatus);

    if (!response) {
      updateSerie("metadata.isFavorite", isFav);
    }
  };

  return (
    <div className="serieActions">
      <DownloadButton serie={manga} updateSerie={updateSerie} />

      <button
        className="favorite"
        onClick={(event) => favoriteSerie(manga.metadata.isFavorite)}
      >
        {manga.metadata.isFavorite ? <IoBookmark /> : <IoBookmarkOutline />}
        Favoritar
      </button>

      <CollectionButton dataPath={manga.dataPath} />

      <button
        className="reading"
        onClick={(event) => lastRead(event, manga.dataPath)}
      >
        <FaBookOpen />
        Continuar
      </button>

      <Rating manga={manga} />
    </div>
  );
}
