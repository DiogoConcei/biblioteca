import "./localUpload.css";
import { useState } from "react";
import { SeriesProcessor, SerieForm } from "../../types/series.interfaces";
import { useLocation } from "react-router-dom";
import FormInfo from "../../components/FormComponents/FormInfo/FormInfo";
import FormGenre from "../../components/FormComponents/FormGenre/FormGenre";
import CostumizeImage from "../../components/CostumizeImage/CostumizeImage";
import FormCollection from "../../components/FormComponents/FormCollection/FormCollection";
import FormBackup from "../../components/FormComponents/FormBackup/FormBackup";
import FormPrivacy from "../../components/FormComponents/FormPrivacy/FormPrivacy";
import FormStatus from "../../components/FormComponents/FormStatus/FormStatus";

export default function LocalUpload() {
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
    collection: [] as string[],
  };

  const location = useLocation();
  const [newSeries, setNewSeries] = useState<SeriesProcessor[]>(
    location.state.newSeries
  );
  const [formData, setFormData] = useState<SerieForm>(emptyForm);

  const handleDataChange = (key: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("Dados do formulário:", formData);
    console.log("Novas séries:", newSeries);
  };

  return (
    <article>
      <section className="div-form-container">
        <span className="series-title">
          {newSeries.map((serie, index) => (
            <h1 key={index}>Personalizando série: {serie.name}</h1>
          ))}
        </span>

        <div className="form-view">
          <CostumizeImage handleDataChange={handleDataChange} />

          <form action="" className="form-content" onSubmit={handleSubmit}>
            {newSeries.map((serie, index) => (
              <div key={index} className="form-container">
                <FormInfo
                  index={index}
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
            ))}

            <button type="submit">Salvar</button>
          </form>
        </div>
      </section>
    </article>
  );
}
