import "./FormInfo.css";
import { FormInputsProps } from "../../../types/components.interfaces";
import { useEffect } from "react";

export default function FormInfo({
  index,
  newSeries,
  setNewSeries,
  handleDataChange,
}: FormInputsProps) {
  useEffect(() => {
    handleChange(index, {
      target: { name: "name", value: newSeries[index].name },
    });
  }, []);

  const handleChange = (
    index: number,
    e: { target: { name: string; value: string } }
  ) => {
    const updatedSeries = [...newSeries];
    updatedSeries[index] = {
      ...updatedSeries[index],
      [e.target.name]: e.target.value,
    };
    setNewSeries(updatedSeries);
    handleDataChange("name", updatedSeries[index].name);
  };

  return (
    <div className="form-inputs">
      <label htmlFor="">
        <input
          type="text"
          name="name"
          value={newSeries[index].name}
          onChange={(e) => handleChange(index, e)}
          placeholder="Nome da série"
          required
        />
      </label>

      <label htmlFor="">
        <input
          type="text"
          name="genre"
          placeholder="Gênero"
          onChange={(e) => handleDataChange("genre", e.target.value)}
        />
      </label>

      <label htmlFor="">
        <input
          type="text"
          name="author"
          placeholder="Autor"
          onChange={(e) => handleDataChange("author", e.target.value)}
        />
      </label>

      <label htmlFor="">
        <input
          type="text"
          name="language"
          placeholder="Idioma original"
          onChange={(e) => handleDataChange("language", e.target.value)}
        />
      </label>
    </div>
  );
}
