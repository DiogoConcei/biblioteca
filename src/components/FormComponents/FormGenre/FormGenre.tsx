import { OnlyDataChangeProp } from "../../../types/components.interfaces";
import "./FormGenre.css";

export default function FormGenre({ handleDataChange }: OnlyDataChangeProp) {
  return (
    <div>
      <h2 className="form-subtitle">Forma de literatura: </h2>

      <div className="form-radio">
        <div>
          <input
            type="radio"
            name="literatureForm"
            value="Manga"
            id="Manga"
            required
            onChange={() => handleDataChange("literatureForm", "Manga")}
          />
          <label htmlFor="Manga">Manga</label>
        </div>
        <div>
          <input
            type="radio"
            name="literatureForm"
            value="Quadrinho"
            id="Quadrinho"
            onChange={() => handleDataChange("literatureForm", "Quadrinhos")}
          />
          <label htmlFor="Quadrinho">Quadrinho</label>
        </div>

        <div>
          <input
            type="radio"
            name="literatureForm"
            value="Livro"
            id="Livro"
            onChange={() => handleDataChange("literatureForm", "Livros")}
          />
          <label htmlFor="Livro">Livro</label>
        </div>
      </div>
    </div>
  );
}
