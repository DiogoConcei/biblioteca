import { FormInputProps } from "../../../../../electron/types/electron-auxiliar.interfaces";
import "./PrivacyField.scss";

export default function PrivacyField({ register, error }: FormInputProps) {
  return (
    <div className="privacy-info">
      <h2 className="form-subtitle">Privacidade:</h2>
      <div className="privacy-container">
        <input type="radio" value="Publica" id="Privacypublic" {...register} />
        <label htmlFor="Privacypublic">Pública</label>

        <input type="radio" value="Privada" id="Privacyprivate" {...register} />
        <label htmlFor="Privacyprivate">Privada</label>
      </div>
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
