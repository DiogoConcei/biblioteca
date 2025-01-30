import "./localUpload.css";
import { MdOutlineEdit, MdDelete, MdOutlineImage } from "react-icons/md";
import { useState } from "react";
import { SeriesProcessor, SerieForm } from "../../types/series.interfaces";
import { useLocation } from "react-router-dom";

export default function LocalUpload() {
  const location = useLocation();
  const [newSeries, setNewSeries] = useState<SeriesProcessor[]>(
    location.state.newSeries || []
  );
  const [formData, setFormData] = useState<SerieForm>();
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

  // const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   const tagArray = value.split(",").map((tag) => tag.trim());
  //   setTags(tagArray);
  // };

  // const handleFormDataChange = (key: keyof SerieForm, value: any) => {
  //   setFormData((prevData) => ({
  //     ...prevData,
  //     [key]: value,
  //   }));
  // };

  // const handleAddCollection = () => {
  //   if (newCollection) {
  //     setFormData((prevData) => ({
  //       ...prevData,
  //       collection: [...prevData.collection, newCollection],
  //     }));
  //     setNewCollection("");
  //     setIsCreatingCollection(false);
  //   }
  // };

  // Função para adicionar tags
  // const addTags = () => {
  //   setFormData((prevData) => ({
  //     ...prevData,
  //     tags: [...prevData.tags, ...tags],
  //   }));
  //   setTags([]);
  // };

  // const handleReadingStatus = (status: string) => {
  //   handleFormDataChange("readingStatus", status);
  // };

  // const handlePrivacy = (option: string) => {
  //   handleFormDataChange("privacy", option);
  // };

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
                {/* <h1>Personalizando {serie.name}</h1>
              <input
                type="text"
                name="name"
                value={serie.name}
                onChange={(e) => handleFormDataChange("name", e.target.value)}
              />
              <input
                type="text"
                name="genre"
                placeholder="Gênero"
                onChange={(e) => handleFormDataChange("genre", e.target.value)}
              />
              <input
                type="text"
                name="author"
                placeholder="Autor"
                onChange={(e) => handleFormDataChange("author", e.target.value)}
              />
              <input
                type="text"
                name="language"
                placeholder="Idioma original"
                onChange={(e) =>
                  handleFormDataChange("language", e.target.value)
                }
              /> */}

                {/* <h2>Forma de literatura: </h2>
              <div>
                <label>
                  <input
                    type="radio"
                    name="literatureForm"
                    value="Option 1"
                    onChange={() =>
                      handleFormDataChange("literatureForm", "Option 1")
                    }
                  />
                  Manga
                </label>

                <label>
                  <input
                    type="radio"
                    name="literatureForm"
                    value="Option 2"
                    onChange={() =>
                      handleFormDataChange("literatureForm", "Option 2")
                    }
                  />
                  Quadrinhos
                </label> 

                <label>
                  <input
                    type="radio"
                    name="literatureForm"
                    value="Option 3"
                    onChange={() =>
                      handleFormDataChange("literatureForm", "Option 3")
                    }
                  />
                  Livros
                </label>
              </div> */}

                {/* <h2>Adicionar a coleção: </h2>
              <div>
                <label>
                  <input type="checkbox" value="Option 1" />
                  Favoritas
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setIsCreatingCollection(!isCreatingCollection)
                  }>
                  Outra
                </button>

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
 */}
                {/* <h2>Privacidade: </h2>
              <div>
                <label>
                  <input
                    type="radio"
                    name="privacy"
                    value="Publica"
                    onChange={() => handleFormDataChange("privacy", "Publica")}
                  />
                  Pública
                </label>

                <label>
                  <input
                    type="radio"
                    name="privacy"
                    value="Privada"
                    onChange={() => handleFormDataChange("privacy", "Privada")}
                  />
                  Privada
                </label>
              </div> */}

                {/* <h2>Adicionar ao auto backup: </h2>
              <div>
                <label>
                  <input
                    type="radio"
                    name="autoBackup"
                    value="Sim"
                    onChange={() => handleFormDataChange("autoBackup", "Sim")}
                  />
                  Sim
                </label>

                <label>
                  <input
                    type="radio"
                    name="autoBackup"
                    value="Não"
                    onChange={() => handleFormDataChange("autoBackup", "Não")}
                  />
                  Não
                </label>
              </div> */}

                {/* <h2>Status de leitura: </h2>
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
              </div> */}

                {/* <h2>Tags: </h2>
              <input
                type="text"
                placeholder="Digite tags separadas por vírgula"
                onChange={(e) => handleTagInput(e)}
              />
              <button type="button" onClick={addTags}>
                Adicionar Tags
              </button> */}

                {/* <h3>Tags Inseridas:</h3> */}
                {/* <ul>
                {tags.map((tag, tagIndex) => (
                  <li key={tagIndex}>{tag}</li>
                ))}
              </ul> */}
                {/* <button type="submit">Salvar</button> */}
              </div>
            ))}
          </form>
        </div>
      </section>
    </article>
  );
}
