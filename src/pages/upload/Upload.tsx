import { useState, useRef, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { ImagePlus, Tag } from "lucide-react";
import { Radius } from "lucide-react";

import { SerieData, SerieForm } from "../../types/series.interfaces";
import "./Upload.scss";

export default function Upload() {
  const location = useLocation();
  const navigate = useNavigate();
  const [newSeries, setNewSeries] = useState<SerieData[]>(() => {
    return (location.state?.serieData as SerieData[]) || [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [imageSrc, setImageSrc] = useState<string>("");
  const coverRef = useRef<HTMLInputElement | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SerieForm>({
    defaultValues: {
      tags: [],
    },
  });

  useEffect(() => {
    if (location.state?.newSeries) {
      setNewSeries(location.state.newSeries as SerieData[]);
      setCurrentIndex(0);
    }
  }, [location.state?.newSeries]);

  const emptyForm = useMemo<SerieForm | null>(() => {
    if (!newSeries.length || !newSeries[currentIndex]) return null;
    const serie = newSeries[currentIndex];

    return {
      name: newSeries[currentIndex].name,
      genre: "",
      author: "",
      cover_path: "",
      language: "",
      literatureForm: "",
      privacy: "",
      autoBackup: "",
      readingStatus: "",
      tags: [], // tags começam vazias
      collections: serie.collections,
      sanitizedName: serie.sanitizedName,
      archivesPath: serie.newPath,
      chaptersPath: serie.chaptersPath,
      oldPath: serie.oldPath,
      createdAt: serie.createdAt,
      deletedAt: serie.deletedAt,
    };
  }, [newSeries, currentIndex]);

  useEffect(() => {
    if (emptyForm) {
      reset(emptyForm);
      setImageSrc("");

      setTags(emptyForm.tags || []);
    }
  }, [emptyForm, reset]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);

    const imagePath = await window.electronAPI.webUtilities.getPathForFile(
      file
    );

    setValue("cover_path", imagePath, { shouldValidate: true });
  };

  const addTagsToForm = (updatedTags: string[]) => {
    setValue("tags", updatedTags, { shouldValidate: true });
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const tagArray = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    setTags(tagArray);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    const timeoutId = window.setTimeout(() => {
      addTagsToForm(tagArray);
    }, 1000);
    setTypingTimeout(timeoutId);
  };

  const flushTags = () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    addTagsToForm(tags);
  };

  const removeTag = (idx: number) => {
    const novaLista = tags.filter((_, i) => i !== idx);
    setTags(novaLista);
    addTagsToForm(novaLista);
  };

  const onSubmit: SubmitHandler<SerieForm> = async (data: SerieForm) => {
    setIsLoading(true);
    const response = await window.electronAPI.upload.uploadSerie(data);

    if (response.success) {
      setIsLoading(false);
      navigate("/");
    }

    return;
  };

  // 14. Navegação entre índices (anterior/próximo)
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };
  const handleNext = () => {
    if (currentIndex < newSeries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="loadingWrapper">
        <Radius className="spinner" />
      </div>
    );
  }

  return (
    <article>
      <section className="sec-form">
        {newSeries.length > 0 && (
          <span className="series-title">
            <h1>Personalizando série: {newSeries[currentIndex].name}</h1>
          </span>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="form-view">
          {/* ==== UPLOAD DE CAPA ==== */}
          <div className="image-upload">
            <span>Capa de exibição</span>
            <div
              className="image-container"
              onClick={() => coverRef.current?.click()}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Preview da capa"
                  className="cover-preview"
                />
              ) : (
                <span className="alert">
                  <ImagePlus color="#8963ba" />
                </span>
              )}
              <input
                id="cover_path"
                type="file"
                accept="image/*"
                className="file-input"
                ref={(e) => {
                  coverRef.current = e;
                }}
                onChange={handleImageChange}
              />
            </div>
            {errors.cover_path && (
              <p className="error">{errors.cover_path.message}</p>
            )}
          </div>

          {/* ==== FORMULÁRIO PRINCIPAL ==== */}
          <div className="form-container">
            {/* ----- Campos de texto ----- */}
            <div className="text-info">
              <input
                id="name"
                type="text"
                placeholder="Nome da série"
                {...register("name", {
                  required: "A Série deve ter um nome",
                })}
              />
              {errors.name && <p className="error">{errors.name.message}</p>}

              <input
                id="genre"
                type="text"
                placeholder="Gênero"
                {...register("genre", {
                  required: "Diga o gênero literário",
                })}
              />
              {errors.genre && <p className="error">{errors.genre.message}</p>}

              <input
                id="author"
                type="text"
                placeholder="Autor"
                {...register("author")}
              />

              <input
                id="language"
                type="text"
                placeholder="Idioma original"
                {...register("language", {
                  required: "Em qual linguagem a série está?",
                })}
              />
              {errors.language && (
                <p className="error">{errors.language.message}</p>
              )}
            </div>

            {/* ----- LiteratureForm (radio) ----- */}
            <div className="literature-info">
              <h2 className="form-subtitle">Forma de literatura:</h2>
              <div className="form-radio">
                <input
                  type="radio"
                  value="Manga"
                  id="Manga"
                  {...register("literatureForm", {
                    required: "Selecione a forma de literatura",
                  })}
                />
                <label htmlFor="Manga">Manga</label>

                <input
                  type="radio"
                  value="Quadrinho"
                  id="Quadrinho"
                  {...register("literatureForm")}
                />
                <label htmlFor="Quadrinho">Quadrinho</label>

                <input
                  type="radio"
                  value="Livro"
                  id="Livro"
                  {...register("literatureForm")}
                />
                <label htmlFor="Livro">Livro</label>
              </div>
              {errors.literatureForm && (
                <p className="error">{errors.literatureForm.message}</p>
              )}
            </div>

            {/* ----- AutoBackup (radio) ----- */}
            <div className="backup-info">
              <h2 className="form-subtitle">Adicionar ao auto backup:</h2>
              <div className="backup-container">
                <input
                  type="radio"
                  value="Sim"
                  id="SimAutoBackup"
                  {...register("autoBackup", {
                    required: "Escolha Sim ou Não",
                  })}
                />
                <label htmlFor="SimAutoBackup">Sim</label>

                <input
                  type="radio"
                  value="Não"
                  id="NaoAutoBackup"
                  {...register("autoBackup")}
                />
                <label htmlFor="NaoAutoBackup">Não</label>
              </div>
              {errors.autoBackup && (
                <p className="error">{errors.autoBackup.message}</p>
              )}
            </div>

            {/* ----- Privacidade (radio) ----- */}
            <div className="privacy-info">
              <h2 className="form-subtitle">Privacidade:</h2>
              <div className="privacy-container">
                <input
                  type="radio"
                  value="Pública"
                  id="Privacypublic"
                  {...register("privacy", {
                    required: "Escolha Pública ou Privada",
                  })}
                />
                <label htmlFor="Privacypublic">Pública</label>

                <input
                  type="radio"
                  value="Privada"
                  id="Privacyprivate"
                  {...register("privacy")}
                />
                <label htmlFor="Privacyprivate">Privada</label>
              </div>
              {errors.privacy && (
                <p className="error">{errors.privacy.message}</p>
              )}
            </div>

            {/* ----- Status de leitura (radio) ----- */}
            <div className="status-info">
              <h2 className="form-subtitle">Status de leitura:</h2>
              <div className="status-container">
                <input
                  type="radio"
                  value="Em andamento"
                  id="StatusEmAndamento"
                  {...register("readingStatus", {
                    required: "Selecione um status",
                  })}
                />
                <label htmlFor="StatusEmAndamento">Em andamento</label>

                <input
                  type="radio"
                  value="Completo"
                  id="StatusCompleto"
                  {...register("readingStatus")}
                />
                <label htmlFor="StatusCompleto">Completo</label>

                <input
                  type="radio"
                  value="Pendente"
                  id="StatusPendente"
                  {...register("readingStatus")}
                />
                <label htmlFor="StatusPendente">Pendente</label>
              </div>
              {errors.readingStatus && (
                <p className="error">{errors.readingStatus.message}</p>
              )}
            </div>

            {/* ----- Tags (campo customizado com debounce) ----- */}
            <div className="tags-info">
              <h2 className="form-subtitle">Tags:</h2>
              <div className="tag-input">
                <input
                  type="text"
                  placeholder="Digite tags separadas por vírgula"
                  onChange={handleTagInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      flushTags();
                    }
                  }}
                  onBlur={() => {
                    flushTags();
                  }}
                />
              </div>
              <div className="form-tag-preview">
                <h3 className="form-subtitle">Tags Inseridas:</h3>
                <ul className="tag-list">
                  {tags.map((tag, idx) => (
                    <li key={idx}>
                      <span>
                        <Tag size={16} /> {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(idx)}
                          className="remove-tag"
                          aria-label={`Remover tag ${tag}`}
                        >
                          &times;
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ----- Navegação e Submit ----- */}
            <div className="navigation-buttons">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === newSeries.length - 1}
              >
                Próximo
              </button>
              <button type="submit">Salvar</button>
            </div>
          </div>
        </form>
      </section>
    </article>
  );
}
