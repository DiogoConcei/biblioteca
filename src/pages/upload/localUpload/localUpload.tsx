import "./localUpload.css";
import { useState } from "react";
import { SeriesProcessor, SerieForm } from "../../../types/series.interfaces";
import { useLocation, useNavigate } from "react-router-dom";
import FormInfo from "../../../components/FormComponents/FormInfo/FormInfo";
import FormGenre from "../../../components/FormComponents/FormGenre/FormGenre";
import CostumizeImage from "../../../components/CostumizeImage/CostumizeImage";
import FormCollection from "../../../components/FormComponents/FormCollection/FormCollection";
import FormBackup from "../../../components/FormComponents/FormBackup/FormBackup";
import FormPrivacy from "../../../components/FormComponents/FormPrivacy/FormPrivacy";
import FormStatus from "../../../components/FormComponents/FormStatus/FormStatus";

export default function LocalUpload() {
  const location = useLocation();
  const [newSeries, setNewSeries] = useState<SeriesProcessor[]>(
    location.state.newSeries
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [imageSrc, setImageSrc] = useState<string>();

  const navigate = useNavigate();

  const emptyForm: SerieForm = {
    name: "",
    genre: "",
    author: "",
    cover_path: "",
    language: "",
    literatureForm: "",
    privacy: "",
    autoBackup: "",
    readingStatus: "",
    collections: newSeries[currentIndex].collections,
    sanitized_name: newSeries[currentIndex].sanitized_name,
    archives_path: newSeries[currentIndex].archives_path,
    chapters_path: newSeries[currentIndex].chapters_path,
    created_at: newSeries[currentIndex].created_at,
    deleted_at: newSeries[currentIndex].deleted_at,
  };

  const [formData, setFormData] = useState<SerieForm>(emptyForm);

  const handleDataChange = (key: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await window.electron.series.createSerie(formData);
    if (currentIndex < newSeries.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setImageSrc("");
    } else {
      console.log("Todas as séries foram personalizadas!");

      navigate("/");
    }
  };

  return (
    <article>
      <section className="div-form-container">
        <span className="series-title">
          <h1>Personalizando série: {newSeries[currentIndex].name}</h1>
        </span>

        <div className="form-view">
          <CostumizeImage
            handleDataChange={handleDataChange}
            setImageSrc={setImageSrc}
            imageSrc={imageSrc}
          />

          <form action="" className="form-content" onSubmit={handleSubmit}>
            <div key={currentIndex} className="form-container">
              <FormInfo
                index={currentIndex}
                newSeries={newSeries}
                setNewSeries={setNewSeries}
                handleDataChange={handleDataChange}
              />
              <FormGenre handleDataChange={handleDataChange} />
              <FormCollection formData={formData} setFormData={setFormData} />
              <FormBackup handleDataChange={handleDataChange} />
              <FormPrivacy handleDataChange={handleDataChange} />
              <FormStatus handleDataChange={handleDataChange} />
            </div>

            {formData.cover_path ? (
              <button type="submit">Salvar</button>
            ) : (
              <button type="submit">Continuar</button>
            )}
          </form>
        </div>
      </section>
    </article>
  );
}
