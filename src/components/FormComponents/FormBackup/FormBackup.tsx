import "./FormBackup.css";
import { OnlyDataChangeProp } from "../../../types/components.interfaces";

export default function FormBackup({ handleDataChange }: OnlyDataChangeProp) {
  return (
    <div className="form-backup-container">
      <h2 className="form-subtitle">Adicionar ao auto backup: </h2>
      <div className="form-backup">
        <input
          type="radio"
          name="autoBackup"
          value="Sim"
          id="SimAutoBackup"
          onChange={() => handleDataChange("autoBackup", "Sim")}
        />
        <label htmlFor="SimAutoBackup">Sim</label>

        <input
          type="radio"
          name="autoBackup"
          id="NaoAutoBackup"
          value="Não"
          onChange={() => handleDataChange("autoBackup", "Não")}
        />
        <label htmlFor="NaoAutoBackup">Não</label>
      </div>
    </div>
  );
}
