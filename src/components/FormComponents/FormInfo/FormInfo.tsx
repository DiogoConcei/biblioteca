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
    handleDataChange("name", newSeries[index].name);
  }, [index]);

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const updatedSeries = [...newSeries];
    updatedSeries[index] = {
      ...updatedSeries[index],
      [name]: value,
    };
    setNewSeries(updatedSeries);

    handleDataChange(name, value);
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
