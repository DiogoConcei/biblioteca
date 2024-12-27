import { Link } from "react-router-dom";
import { Comic } from "../../types/serie.interfaces";
import SearchBar from "../SearchBar/SearchBar";
import "./ComicCards.css";
import { useEffect, useState } from "react";

export default function ComicCards() {
  const [series, setSerie] = useState<Comic[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");

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

  const searchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setSearchInput(event.target.value);
  };

  const filteredSeries = series.filter((serie) => {
    const serieName = serie.name.toLowerCase().trim();
    const searchTerm = searchInput.toLowerCase().trim();

    console.log("serieName:", serieName); // Verifique o nome da série
    console.log("searchTerm:", searchTerm); // Verifique o valor da pesquisa

    return searchTerm === "" || serieName.includes(searchTerm);
  });

  return (
    <div className="content">
      <SearchBar searchInput={searchInput} onSearchChange={searchChange} />
      <div className="seriesContent">
        {filteredSeries.map((serie) => (
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
