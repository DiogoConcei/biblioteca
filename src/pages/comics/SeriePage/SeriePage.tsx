import { useLocation } from "react-router-dom";
import { Comic } from "../../../types/serie.interfaces";
import ChaptersInfo from "../../../components/chaptersInfo/chaptersInfo";
import { HiDownload } from "react-icons/hi";
import { MdFormatListBulletedAdd } from "react-icons/md";
import { IoMdStar, IoIosStarOutline } from "react-icons/io";
import { IoBookmarkOutline, IoBookmark } from "react-icons/io5";
import { FaBookOpen } from "react-icons/fa";

import "../SeriePage/SeriePage.css";

export default function SeriePage() {
  const location = useLocation();

  const { serie } = location.state as { serie: Comic };

  const favorite = async (
    event: React.MouseEvent<HTMLButtonElement>,
    serieName: string,
    is_favorite: boolean
  ) => {
    await window.electron.favoriteSerie(serieName, is_favorite);
  };

  return (
    <section className="serieInfo">
      <div className="serieHeader">
        <figure>
          <img
            src={`data:image/png;base64,${serie.cover_image}`}
            alt={`Capa do quadrinho ${serie.name}`}
          />
        </figure>
        <div className="serieDetails">
          <span>
            <p>{serie.name}</p>
          </span>
          <div className="serieActions">
            <p>
              <HiDownload />
            </p>
            <button
              className="favorite"
              onClick={(event) =>
                favorite(event, serie.name, serie.metadata.is_favorite)
              }>
              {serie.metadata.is_favorite ? (
                <IoBookmark />
              ) : (
                <IoBookmarkOutline />
              )}
              Favoritar
            </button>
            <p>
              <MdFormatListBulletedAdd />
            </p>
            <p>
              <FaBookOpen />
            </p>
            <p>
              {serie.metadata.is_favorite ? <IoMdStar /> : <IoIosStarOutline />}
            </p>
          </div>
        </div>
      </div>

      {/* <h1>{serie.name}</h1> */}
      {/* <p>Total de capítulos: {serie.total_chapters}</p> */}
      {/* <p>{serie.reading_data.last_chapter_id} - last chapter read</p> */}
      {/* <p>{serie.created_at} - create date</p> */}
      {/* </figcaption> */}
      {/* </figure> */}
      {/* </div> */}
      {/* <div className="chaptersControl">
        <ChaptersInfo serie={serie} />
      </div> */}
    </section>
  );
}
