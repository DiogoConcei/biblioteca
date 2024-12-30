import { useParams } from "react-router-dom";
import { Comic } from "../../../types/serie.interfaces";
import { useState, useEffect } from "react";
import ComicActions from "../../../components/ComicActions/ComicActions";
import "./SeriePage.css";

export default function SeriePage() {
  const [serie, setSerie] = useState<Comic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { book_name } = useParams();

  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);
        const data = await window.electron.getSerie(book_name);
        setSerie(data);
      } catch (error) {
        console.error("Erro ao carregar série:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getData();
  }, [book_name]);
  if (!serie) {
    return <p>Carrengado dados...</p>;
  }

  return (
    <section>
      <div className="serieHeader">
        <figure>
          <img
            src={`data:image/png;base64,${serie.cover_image}`}
            alt={`Capa do quadrinho ${serie.name}`}
          />
        </figure>
        <div className="serieDetails">
          <h2>{serie.name}</h2>
          <div>
            <p>
              <span>Status: </span> {serie.metadata.status}
            </p>
            <p>
              <span>Capitulos lidos: </span>
              {serie.chapters_read}
            </p>
            <p>
              <span>Quantidade de capitulos:</span> {serie.total_chapters}
            </p>
            <p>
              <span>Criado em: </span>
              {serie.created_at}
            </p>
            <p>
              <span>Ultimo capitulo lido:</span>{" "}
              {serie.reading_data.last_chapter_id}
            </p>
          </div>
          <ComicActions serie={serie} setSerie={setSerie} />
        </div>
      </div>
    </section>
  );
}
