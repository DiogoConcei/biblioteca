import { Link } from "react-router-dom";
import { Comic } from "../../types/serie.interfaces";
import SearchBar from "../SearchBar/SearchBar";
import { ComicCardsProps } from "../../types/components.interfaces";
import "./ComicCards.css";
import { useEffect, useState } from "react";

export default function ComicCards({ searchInput }: ComicCardsProps) {
  const [series, setSeries] = useState<Comic[]>([]);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await window.electron.series.getSeries();
        setSeries(data);
      } catch (error) {
        console.error("Erro ao carregar imagens", error);
      }
    };

    getData();

    const onSerieCreated = () => {
      getData();
    };

    window.electron.eventEmitter.on("serie-created", onSerieCreated);

    return () => {
      window.electron.eventEmitter.off("serie-created", onSerieCreated);
    };
  }, []);

  const filteredSeries = series.filter((serie) => {
    const serieName = serie.name.toLowerCase();
    const searchTerm = searchInput.toLowerCase();

    const normalizedSerieName = serieName.replace(/\s+/g, "");
    const normalizedSearchTerm = searchTerm.replace(/\s+/g, "");

    return (
      searchTerm === "" || normalizedSerieName.includes(normalizedSearchTerm)
    );
  });

  return (
    <div className="content">
      <div className="seriesContent">
        {filteredSeries.map((serie) => (
          <Link
            to={`/${serie.name}/${serie.id}`}
            key={serie.id}
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
              <span className="readsInfo">
                <p>{serie.chapters_read}</p>
                <p>{serie.total_chapters}</p>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
