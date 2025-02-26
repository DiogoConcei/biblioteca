import { Link, useNavigate } from "react-router-dom";
import { ExhibitionSerieData } from "../../types/series.interfaces";
import { ComicCardsProps } from "../../types/components.interfaces";
import { FaPlay } from "react-icons/fa";
import "./SeriesCards.css";
import { useEffect, useState } from "react";

export default function SeriesCards({ searchInput }: ComicCardsProps) {
  const [series, setSeries] = useState<ExhibitionSerieData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await window.electron.series.getSeries();
        setSeries(data);
      } catch (error) {
        console.error("Erro ao carregar imagens", error);
        throw error;
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

  const lastChapter = async (
    e: React.MouseEvent<HTMLDivElement | SVGElement>,
    dataPath: string
  ) => {
    e.preventDefault();
    const lastChapterUrl = await window.electron.chapters.acessLastRead(
      dataPath
    );
    navigate(lastChapterUrl, { state: { dataPath } });
    lastChapterUrl;
  };

  return (
    <div className="content">
      <div className="seriesContent">
        {filteredSeries.map((serie) => (
          <Link
            to={`${serie.literatureForm}/${serie.name}/${serie.id}`}
            key={serie.id}
            className="serieLink"
          >
            <figure className="coverCard">
              <img
                src={`data:image;base64,${serie.coverImage}`}
                alt={`Série: ${serie.name}`}
              />
              <figcaption>
                <FaPlay
                  className="playChapter"
                  onClick={(e) => lastChapter(e, serie.dataPath)}
                />
              </figcaption>
            </figure>
            <div className="serie-info">
              <p className="serie-name">{serie.name}</p>
              <div className="progress-bar">
                <div
                  className="progress-bar-completed"
                  style={{
                    width: `${
                      (serie.chaptersRead / serie.totalChapters) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <span className="readsInfo">
                <p>{serie.chaptersRead}</p>
                <p>{serie.totalChapters}</p>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
