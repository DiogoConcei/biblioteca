import "./localUpload.css";
import { MdOutlineEdit, MdDelete, MdOutlineImage } from "react-icons/md";
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
import FormTag from "../../components/FormComponents/FormTag/FormTag";

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
    location.state.newSeries
  );
  const [formData, setFormData] = useState<SerieForm>(emptyForm);

  const handleDataChange = (key: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  return (
    <article>
      <section className="div-form-container">
        <div className="form-view">
          <CostumizeImage />

          <form action="" className="form-content">
            <span className="series-title">
              {newSeries.map((serie, index) => (
                <h1 key={index}>Personalizando série: {serie.name}</h1>
              ))}
            </span>

            {newSeries.map((serie, index) => (
              <div key={index} className="form-container">
                <FormInfo
                  serie={serie}
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
                <FormTag
                  handleDataChange={handleDataChange}
                  setFormData={setFormData}
                />
              </div>
            ))}

            <button type="submit">Salvar</button>
          </form>
        </div>
      </section>
    </article>
  );
}
