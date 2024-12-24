import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Comic } from "../../types/serie.interfaces";
import "./Home.css";

export default function Home() {
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

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();

    const files = event.dataTransfer.files;
    const filePaths = Array.from(files).map((file) => {
      return window.electron.webUtils.getPathForFile(file);
    });

    try {
      const newPaths = await Promise.all(
        await window.electron.handleDrop(filePaths)
      );
      await window.electron.createSerie(newPaths);
    } catch (error) {
      console.error("Erro ao carregar arquivos", error);
    }
  };

  return (
    <section className="series" onDragOver={handleDrag} onDrop={handleDrop}>
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
            <p className="serieName">{serie.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
