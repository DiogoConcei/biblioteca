import { Link } from "react-router-dom";
import { Comic } from "../../types/serie.interfaces";
import "../comicCards/comicCards.css";
import { useEffect, useState } from "react";

export default function ComicCards() {
  const [series, setSerie] = useState<Comic[]>([]);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await window.electron.getSeries();
        setSerie(data);
      } catch (error) {
        console.error("Erro ao carregar imagens", error);
      }
    };

    getData();

    const onSerieCreated = () => {
      getData();
    };

    window.electron.on("serie-created", onSerieCreated);

    return () => {
      window.electron.off("serie-created", onSerieCreated);
    };
  }, []);

  return (
    <div className="seriesContent">
      {series.map((serie) => (
        <Link
          to={`/${serie.name}/${serie.id}`}
          key={serie.id}
          state={{ serie }}
          className="serieLink">
          <figure>
            <img
              src={`data:image/png;base64,${serie.cover_image}`}
              alt={`Série: ${serie.name}`}
            />
          </figure>
          <div className="serie-info">
            <p className="serie-name">{serie.name}</p>
            <div className="progress-bar">
              <div
                className="progress-bar-completed"
                style={{
                  width: `${
                    (serie.chapters_read / serie.total_chapters) * 100
                  }%`,
                }}></div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
