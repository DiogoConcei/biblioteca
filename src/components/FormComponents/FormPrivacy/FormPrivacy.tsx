import "./FormPrivacy.css";
import { OnlyDataChangeProp } from "../../../types/components.interfaces";

export default function FormPrivacy({ handleDataChange }: OnlyDataChangeProp) {
  const handlePrivacy = (option: string) => {
    handleDataChange("privacy", option);
  };

  return (
    <div className="form-privacy-container">
      <h2 className="form-subtitle">Privacidade: </h2>
      <div className="form-privacy">
        <input
          type="radio"
          name="privacy"
          value="Publica"
          id="Privacypublic"
          onChange={() => handleDataChange("privacy", "Publica")}
        />

        <label htmlFor="Privacypublic">Pública</label>

        <input
          type="radio"
          name="privacy"
          value="Privada"
          id="Privacyprivate"
          onChange={() => handleDataChange("privacy", "Privada")}
        />
        <label htmlFor="Privacyprivate">Privada</label>
      </div>
    </div>
  );
}
