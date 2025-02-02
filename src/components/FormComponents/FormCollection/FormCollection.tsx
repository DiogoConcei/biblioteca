import "./FormCollection.css";
import { FormCollectionProps } from "../../../types/components.interfaces";
import { useState } from "react";

export default function FormCollection({
  formData,
  setFormData,
}: FormCollectionProps) {
  const [isCreatingCollection, setIsCreatingCollection] =
    useState<boolean>(false);
  const [collections, setCollections] = useState<string[]>(["Favoritas"]);
  const [newCollection, setNewCollection] = useState<string>("");

  const handleCheckboxChange = (collection: string, checked: boolean) => {
    setFormData((prevData) => ({
      ...prevData,
      collection: checked
        ? [...prevData.collection, collection]
        : prevData.collection.filter((col) => col !== collection),
    }));
  };

  const handleButtonClick = () => {
    if (isCreatingCollection) {
      if (newCollection && !collections.includes(newCollection)) {
        setFormData((prevData) => ({
          ...prevData,
          collection: [...prevData.collection, newCollection],
        }));
        setCollections((prevCollections) => [
          ...prevCollections,
          newCollection,
        ]);
        setNewCollection("");
      }
      setIsCreatingCollection(false);
    } else {
      setIsCreatingCollection(true);
    }
  };

  return (
    <div className="form-collection-container">
      <h2 className="form-subtitle">Incluir na coleção: </h2>

      <div className="form-collection">
        {collections.map((collection, index) => (
          <span key={index}>
            <input
              type="checkbox"
              value={collection}
              id={collection}
              name={collection}
              checked={formData.collection.includes(collection)}
              onChange={(e) =>
                handleCheckboxChange(collection, e.target.checked)
              }
            />
            <label htmlFor={collection}>{collection}</label>
          </span>
        ))}
      </div>

      <div className="form-add-collection">
        {isCreatingCollection && (
          <input
            type="text"
            value={newCollection}
            placeholder="Digite o nome da nova coleção"
            onChange={(e) => setNewCollection(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleButtonClick();
              }
            }}
          />
        )}

        <button type="button" onClick={handleButtonClick}>
          {isCreatingCollection ? "Salvar Coleção" : "Adicionar coleção"}
        </button>
      </div>
    </div>
  );
}
