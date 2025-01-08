import "./ComicVisualizer.css";
import { useParams } from "react-router-dom";

export function ComicVisualizer() {
  const { book_name, id, chapter_name } = useParams();

  return (
    <div>
      <h1>
        {book_name} com o id de : {id}
      </h1>
      <p>Nome do capítulo: {chapter_name}</p>
    </div>
  );
}
