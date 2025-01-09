import "./ComicVisualizer.css";
import { useParams } from "react-router-dom";

export function ComicVisualizer() {
  const { chapter_name, chapter_id } = useParams();

  return (
    <div>
      <p>Nome do capítulo: {chapter_name}</p>
      <p>Id do capítulo: {chapter_id}</p>
    </div>
  );
}
