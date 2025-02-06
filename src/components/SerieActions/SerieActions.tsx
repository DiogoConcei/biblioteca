import { IoBookmarkOutline, IoBookmark } from "react-icons/io5";
import { FaBookOpen } from "react-icons/fa";
import { ComicActionsProps } from "../../types/components.interfaces";
import DownloadButton from "../DonwloadButton/DownloadButton";
import Rating from "../Rating/Rating";
import { useNavigate } from "react-router-dom";
import "./SerieActions.css";
import CollectionButton from "../CollectionButton/CollectionButton";

export default function SerieActions({ manga, setManga }: ComicActionsProps) {
  const navigate = useNavigate();

  const favorite = async (is_favorite: boolean) => {
    const newFavoriteStatus = !is_favorite;

    try {
      const response = await window.electron.userAction.favoriteSerie(
        manga.data_path
      );

      if (response.success) {
        setManga((prevSerie) => ({
          ...prevSerie!,
          metadata: {
            ...prevSerie!.metadata,
            is_favorite: newFavoriteStatus,
          },
        }));
      }
    } catch (error) {
      console.error("Erro ao favoritar série:", error);
      throw error;
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
      <DownloadButton dataPath={manga.data_path} />
      <button
        className="favorite"
        onClick={(event) => favorite(manga.metadata.is_favorite)}>
        {manga.metadata.is_favorite ? <IoBookmark /> : <IoBookmarkOutline />}
        Favoritar
      </button>
      <CollectionButton dataPath={manga.data_path} />
      <button
        className="reading"
        onClick={(event) => lastRead(event, manga.data_path)}>
        <FaBookOpen />
        Continuar
      </button>
      <Rating manga={manga} />
    </div>
  );
}
