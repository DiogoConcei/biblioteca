import "./localUpload.css";
import { useState, useEffect } from "react";
import { SeriesProcessor, SerieForm } from "../../../types/series.interfaces";
import { useLocation, useNavigate } from "react-router-dom";
import FormInfo from "../../../components/FormComponents/FormInfo/FormInfo";
import FormGenre from "../../../components/FormComponents/FormGenre/FormGenre";
import ImageUpload from "../../../components/ImageUpload/ImageUpload";
import FormCollection from "../../../components/FormComponents/FormCollection/FormCollection";
import FormBackup from "../../../components/FormComponents/FormBackup/FormBackup";
import FormPrivacy from "../../../components/FormComponents/FormPrivacy/FormPrivacy";
import FormStatus from "../../../components/FormComponents/FormStatus/FormStatus";
import FormTag from "../../../components/FormComponents/FormTag/FormTag";
import NativeImages from "../../../components/NativeImages/NativeImages";

export default function LocalUpload() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialSeries = location.state?.newSeries || [];
  const [newSeries, setNewSeries] = useState<SeriesProcessor[]>(initialSeries);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [imageSrc, setImageSrc] = useState("");
  const [formSteps, setFormSteps] = useState<number>(0);
  const [showSecondStep, setShowSecondStep] = useState<boolean>(false);

  const getEmptyForm = (): SerieForm | null => {
    if (!newSeries.length || !newSeries[currentIndex]) return null;
    return {
      name: newSeries[currentIndex].name.replace("/#/g", ""),
      genre: "",
      author: "",
      cover_path: "",
      language: "",
      literatureForm: "",
      privacy: "",
      autoBackup: "",
      readingStatus: "",
      tags: [],
      collections: newSeries[currentIndex].collections,
      sanitizedName: newSeries[currentIndex].sanitizedName,
      archivesPath: newSeries[currentIndex].archivesPath,
      chaptersPath: newSeries[currentIndex].chaptersPath,
      createdAt: newSeries[currentIndex].createdAt,
      deletedAt: newSeries[currentIndex].deletedAt,
    };
  };

  const [formData, setFormData] = useState<SerieForm | null>(getEmptyForm());

  useEffect(() => {
    const newForm = getEmptyForm();
    if (newForm) {
      setFormData(newForm);
      setFormSteps(0);
    }
  }, [currentIndex]);

  const handleDataChange = (key: keyof SerieForm, value: any) => {
    setFormData((prevData) =>
      prevData ? { ...prevData, [key]: value } : prevData
    );
  };

  const handleSubmit = async () => {
    if (showSecondStep) {
      await decodeImage();
    }
    if (formData) {
      await window.electron.series.createSerie(formData);
      if (currentIndex < newSeries.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setImageSrc("");
      } else {
        navigate("/");
      }
    }
  };

  const decodeImage = async () => {
    const img = await window.electron.upload.decodePathFile(
      formData.name,
      formData.cover_path
    );

    formData.cover_path = img;
  };

  const advanceForm = (goToSecondStep: boolean) => {
    if (goToSecondStep && imageSrc) return;

    setFormSteps(goToSecondStep ? 1 : 0);
    setShowSecondStep(goToSecondStep);
  };

  return (
    <article>
      <section className="div-form-container">
        {newSeries.length > 0 && (
          <span className="series-title">
            <h1>Personalizando série: {newSeries[currentIndex].name}</h1>
          </span>
        )}

        <div className="form-view">
          <ImageUpload
            handleDataChange={handleDataChange}
            setImageSrc={setImageSrc}
            imageSrc={imageSrc}
            formSteps={formSteps}
          />

          <form className="form-content" onSubmit={(e) => e.preventDefault()}>
            {!showSecondStep && formSteps === 0 && formData && (
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
                <FormTag setFormData={setFormData} />
                <FormStatus handleDataChange={handleDataChange} />
              </div>
            )}

            {showSecondStep && formData && (
              <NativeImages
                setFormData={setFormData}
                setImageSrc={setImageSrc}
                archivesPath={formData.archivesPath}
                literatureForm={formData.literatureForm}
              />
            )}

            <div
              className={`FormBtnContainer ${
                showSecondStep ? "dinamicCovers" : ""
              }`}
            >
              {formData?.literatureForm === "Manga" ||
              formData?.literatureForm === "Quadrinho" ? (
                <>
                  {/* Se não há imagem e ainda não foi para a segunda etapa, mostra “Continuar” */}
                  {!imageSrc && !showSecondStep && (
                    <button
                      className="form-content-buttons"
                      type="button"
                      onClick={() => advanceForm(true)}
                    >
                      Continuar
                    </button>
                  )}

                  {/* Se estiver na segunda etapa, mostra “Voltar” */}
                  {showSecondStep && (
                    <button
                      className="form-content-buttons"
                      type="button"
                      onClick={() => advanceForm(false)}
                    >
                      Voltar
                    </button>
                  )}

                  {/* Se houver imagem e não estiver na segunda etapa, ou se já estiver na segunda etapa e houver cover_path, mostra “Salvar” */}
                  {((imageSrc && !showSecondStep) ||
                    (showSecondStep && formData?.cover_path)) && (
                    <button type="submit" onClick={handleSubmit}>
                      Salvar
                    </button>
                  )}
                </>
              ) : (
                // Para outros tipos de série, por exemplo, salvar direto:
                <button type="submit" onClick={handleSubmit}>
                  Salvar
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </article>
  );
}
