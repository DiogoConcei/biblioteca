import "./localUpload.css";
import { MdOutlineEdit, MdDelete } from "react-icons/md";
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
  const [imageSrc, setImageSrc] = useState<string>("default-image.jpg");
  const [tags, setTags] = useState<string[]>([]);

  // Função para lidar com o evento de seleção de imagem
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

  // Função para lidar com a entrada de tags
  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const tagArray = value.split(",").map((tag) => tag.trim());
    setTags(tagArray);
  };

  // Função para atualizar o estado de formData
  const handleFormDataChange = (key: keyof SerieForm, value: any) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  // Função para adicionar coleções
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

  // Função para adicionar tags
  const addTags = () => {
    setFormData((prevData) => ({
      ...prevData,
      tags: [...prevData.tags, ...tags],
    }));
    setTags([]);
  };

  const handleReadingStatus = (status: string) => {
    handleFormDataChange("readingStatus", status);
  };

  const handlePrivacy = (option: string) => {
    handleFormDataChange("privacy", option);
  };

  if (!newSeries.length) {
    return <p>Carregando...</p>;
  }

  return (
    <section>
      <div>
        <img src={imageSrc} alt="Imagem ou Capa" />
        <MdOutlineEdit />
        <MdDelete />
        <h2>Imagem ou Capa: </h2>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <p>{newSeries[0].name}</p>
        {/* <form action="">
          {newSeries.length > 0 ? (
            newSeries.map((serie, index) => (
              <div key={index}>
                <h1>Personalizando {serie.name}</h1>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleFormDataChange("name", e.target.value)}
                />
                <input
                  type="text"
                  name="genre"
                  placeholder="Gênero"
                  value={formData.genre}
                  onChange={(e) =>
                    handleFormDataChange("genre", e.target.value)
                  }
                />
                <input
                  type="text"
                  name="author"
                  placeholder="Autor"
                  value={formData.author}
                  onChange={(e) =>
                    handleFormDataChange("author", e.target.value)
                  }
                />
                <input
                  type="text"
                  name="language"
                  placeholder="Idioma original"
                  value={formData.language}
                  onChange={(e) =>
                    handleFormDataChange("language", e.target.value)
                  }
                />

                <h2>Forma de literatura: </h2>
                <div>
                  <label>
                    <input
                      type="radio"
                      name="literatureForm"
                      value="Option 1"
                      checked={formData.literatureForm === "Option 1"}
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
                      checked={formData.literatureForm === "Option 2"}
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
                      checked={formData.literatureForm === "Option 3"}
                      onChange={() =>
                        handleFormDataChange("literatureForm", "Option 3")
                      }
                    />
                    Livros
                  </label>
                </div>

                <h2>Adicionar a coleção: </h2>
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

                <h2>Privacidade: </h2>
                <div>
                  <label>
                    <input
                      type="radio"
                      name="privacy"
                      value="Publica"
                      checked={formData.privacy === "Publica"}
                      onChange={() =>
                        handleFormDataChange("privacy", "Publica")
                      }
                    />
                    Pública
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="privacy"
                      value="Privada"
                      checked={formData.privacy === "Privada"}
                      onChange={() =>
                        handleFormDataChange("privacy", "Privada")
                      }
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
                      checked={formData.autoBackup === "Sim"}
                      onChange={() => handleFormDataChange("autoBackup", "Sim")}
                    />
                    Sim
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="autoBackup"
                      value="Não"
                      checked={formData.autoBackup === "Não"}
                      onChange={() => handleFormDataChange("autoBackup", "Não")}
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
                      checked={formData.readingStatus === "Em andamento"}
                      onChange={() => handleReadingStatus("Em andamento")}
                    />
                    Em andamento
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="Completo"
                      checked={formData.readingStatus === "Completo"}
                      onChange={() => handleReadingStatus("Completo")}
                    />
                    Completo
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="Pendente"
                      checked={formData.readingStatus === "Pendente"}
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
            ))
          ) : (
            <div>
              <p>Nenhuma série encontrada</p>
              <p>{newSeries[0].name}</p>
            </div>
          )}
        </form> */}
      </div>
    </section>
  );
}
