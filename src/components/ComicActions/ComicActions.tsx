import { MdFormatListBulletedAdd } from "react-icons/md";
import { IoBookmarkOutline, IoBookmark } from "react-icons/io5";
import { FaBookOpen } from "react-icons/fa";
import { ComicActionsProps } from "../../types/components.interfaces";
import DownloadButton from "../DonwloadButton/DownloadButton";
import Rating from "../Rating/Rating";
import "./ComicActions.css";

export default function ComicActions({ serie, setSerie }: ComicActionsProps) {
  const favorite = async (
    event: React.MouseEvent<HTMLButtonElement>,
    serieName: string,
    is_favorite: boolean
  ) => {
    const newFavoriteStatus = !is_favorite;

    setSerie((prevSerie) => ({
      ...prevSerie!,
      metadata: {
        ...prevSerie!.metadata,
        is_favorite: newFavoriteStatus,
      },
    }));

    try {
      const response = await window.electron.serieActions.favoriteSerie(
        serieName,
        newFavoriteStatus
      );

      if (response.success) {
        setSerie((prevSerie) => ({
          ...prevSerie!,
          metadata: {
            ...prevSerie!.metadata,
            is_favorite: newFavoriteStatus,
          },
        }));
      }
    } catch (error) {
      console.error("Erro ao favoritar série:", error);

      setSerie((prevSerie) => ({
        ...prevSerie!,
        metadata: {
          ...prevSerie!.metadata,
          is_favorite: is_favorite,
        },
      }));
    }
  };

  return (
    <div className="serieActions">
      <DownloadButton seriePath={serie.serie_path} />
      <button
        className="favorite"
        onClick={(event) =>
          favorite(event, serie.name, serie.metadata.is_favorite)
        }>
        {serie.metadata.is_favorite ? <IoBookmark /> : <IoBookmarkOutline />}
        Favoritar
      </button>
      <button className="collection">
        <MdFormatListBulletedAdd />
        Coleção
      </button>
      <button className="reading">
        <FaBookOpen />
        Continuar
      </button>
      <Rating serie={serie} />
    </div>
  );
}
