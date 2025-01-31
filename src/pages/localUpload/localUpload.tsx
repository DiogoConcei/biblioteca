import "./localUpload.css";
import { MdOutlineEdit, MdDelete, MdOutlineImage } from "react-icons/md";
import { useState } from "react";
import { SeriesProcessor, SerieForm } from "../../types/series.interfaces";
import { useLocation } from "react-router-dom";

export default function LocalUpload() {
  const emptyForm: SerieForm = {
    name: "",
    genre: "",
    author: "",
    language: "",
    literatureForm: "",
    privacy: "",
    autoBackup: "",
    readingStatus: "",
    tags: [] as string[],
    collection: [] as string[],
  };

  const location = useLocation();
  const [newSeries, setNewSeries] = useState<SeriesProcessor[]>(
    location.state.newSeries || []
  );
  const [formData, setFormData] = useState<SerieForm>(emptyForm);
  const [isCreatingCollection, setIsCreatingCollection] =
    useState<boolean>(false);
  const [newCollection, setNewCollection] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<string>();
  const [tags, setTags] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updatedSeries = [...newSeries];
    updatedSeries[index] = {
      ...updatedSeries[index],
      [e.target.name]: e.target.value,
    };
    setNewSeries(updatedSeries);

    setFormData((prevData) => ({
      ...prevData,
      ["name"]: e.target.name,
    }));
  };

  const handleDataChange = (key: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const tagArray = value.split(",").map((tag) => tag.trim());
    setTags(tagArray);
  };

  const handleAddCollection = () => {
    if (newCollection) {
      setFormData((prevData) => ({
        ...prevData,
        collection: [...prevData.collection, newCollection],
      }));
      setNewCollection("");
      setIsCreatingCollection(false);
    }
  };

  const addTags = () => {
    setFormData((prevData) => ({
      ...prevData,
      tags: [...prevData.tags, ...tags],
    }));
    setTags([]);
  };

  const handleReadingStatus = (status: string) => {
    handleDataChange("readingStatus", status);
  };

  const handlePrivacy = (option: string) => {
    handleDataChange("privacy", option);
  };

  return (
    <article>
      <section className="form-view">
        <div className="form-container">
          <div className="cover-container">
            <p className="cover-title">Capa de exibição</p>
            <div
              className="image-upload"
              onClick={() => document.getElementById("fileInput")?.click()}>
              {imageSrc ? (
                <img src={imageSrc} alt="Preview" className="cover-preview" />
              ) : (
                <span className="alert">
                  <MdOutlineImage className="insert-image" />
                </span>
              )}
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                className="file-input"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <form action="" className="form-content">
            <span className="series-title">
              {newSeries.map((serie, index) => (
                <h1 key={index}>Personalizando série: {serie.name}</h1>
              ))}
            </span>

            {newSeries.map((serie, index) => (
              <div key={index}>
                <div>
                  <label htmlFor="">
                    <input
                      type="text"
                      name="name"
                      value={serie.name}
                      onChange={(e) => handleChange(index, e)}
                      required
                    />
                  </label>

                  <label htmlFor="">
                    <input
                      type="text"
                      name="genre"
                      placeholder="Gênero"
                      onChange={(e) =>
                        handleDataChange("genre", e.target.value)
                      }
                    />
                  </label>

                  <label htmlFor="">
                    <input
                      type="text"
                      name="author"
                      placeholder="Autor"
                      onChange={(e) =>
                        handleDataChange("author", e.target.value)
                      }
                    />
                  </label>

                  <label htmlFor="">
                    <input
                      type="text"
                      name="language"
                      placeholder="Idioma original"
                      onChange={(e) =>
                        handleDataChange("language", e.target.value)
                      }
                    />
                  </label>
                </div>

                <h2>Forma de literatura: </h2>
                <div>
                  <label htmlFor="">
                    <input
                      type="radio"
                      name="literatureForm"
                      value="Manga"
                      onChange={() =>
                        handleDataChange("literatureForm", "Manga")
                      }
                    />
                    Manga
                  </label>

                  <label htmlFor="">
                    <input
                      type="radio"
                      name="literatureForm"
                      value="Quadrinhos"
                      onChange={() =>
                        handleDataChange("literatureForm", "Quadrinhos")
                      }
                    />
                    Quadrinhos
                  </label>

                  <label htmlFor="">
                    <input
                      type="radio"
                      name="literatureForm"
                      value="Livros"
                      onChange={() =>
                        handleDataChange("literatureForm", "Livros")
                      }
                    />
                    Livros
                  </label>
                </div>

                <h2>Adicionar a coleção: </h2>
                <div>
                  <label>
                    <input type="checkbox" value="Favoritas" />
                    Favoritas
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setIsCreatingCollection(!isCreatingCollection)
                    }>
                    Outra
                  </button>

                  {/* Necessário adicionar uma funcionalidade para salvar as coleções  */}
                  {/* visando facilitar as exibições em relação as coleções */}

                  {formData.collection.map((collection, index) => (
                    <label key={index}>
                      <input type="checkbox" value={collection} />
                      {collection}
                    </label>
                  ))}

                  {isCreatingCollection && (
                    <div>
                      <input
                        type="text"
                        value={newCollection}
                        placeholder="Digite o nome da nova coleção"
                        onChange={(e) => setNewCollection(e.target.value)}
                      />
                      <button type="button" onClick={handleAddCollection}>
                        Adicionar Coleção
                      </button>
                    </div>
                  )}
                </div>

                <h2>Privacidade: </h2>
                <div>
                  <label>
                    <input
                      type="radio"
                      name="privacy"
                      value="Publica"
                      onChange={() => handleDataChange("privacy", "Publica")}
                    />
                    Pública
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="privacy"
                      value="Privada"
                      onChange={() => handleDataChange("privacy", "Privada")}
                    />
                    Privada
                  </label>
                </div>

                <h2>Adicionar ao auto backup: </h2>
                <div>
                  <label>
                    <input
                      type="radio"
                      name="autoBackup"
                      value="Sim"
                      onChange={() => handleDataChange("autoBackup", "Sim")}
                    />
                    Sim
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="autoBackup"
                      value="Não"
                      onChange={() => handleDataChange("autoBackup", "Não")}
                    />
                    Não
                  </label>
                </div>

                <h2>Status de leitura: </h2>
                <div>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="Em andamento"
                      onChange={() => handleReadingStatus("Em andamento")}
                    />
                    Em andamento
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="Completo"
                      onChange={() => handleReadingStatus("Completo")}
                    />
                    Completo
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="Pendente"
                      onChange={() => handleReadingStatus("Pendente")}
                    />
                    Pendente
                  </label>
                </div>

                <h2>Tags: </h2>
                <input
                  type="text"
                  placeholder="Digite tags separadas por vírgula"
                  onChange={(e) => handleTagInput(e)}
                />
                <button type="button" onClick={addTags}>
                  Adicionar Tags
                </button>

                <h3>Tags Inseridas:</h3>
                <ul>
                  {tags.map((tag, tagIndex) => (
                    <li key={tagIndex}>{tag}</li>
                  ))}
                </ul>
                <button type="submit">Salvar</button>
              </div>
            ))}
          </form>
        </div>
      </section>
    </article>
  );
}
