import "./FormStatus.css";
import { OnlyDataChangeProp } from "../../../types/components.interfaces";

export default function FormStatus({ handleDataChange }: OnlyDataChangeProp) {
  const handleReadingStatus = (status: string) => {
    handleDataChange("readingStatus", status);
  };

  return (
    <div className="form-status-container">
      <h2 className="form-subtitle">Status de leitura: </h2>
      <div className="form-status">
        <input
          type="radio"
          name="status"
          value="Em andamento"
          id="StatusEmAndamento"
          onChange={() => handleReadingStatus("Em andamento")}
        />

        <label htmlFor="StatusEmAndamento">Em andamento</label>

        <input
          type="radio"
          name="status"
          value="Completo"
          id="StatusCompleto"
          onChange={() => handleReadingStatus("Completo")}
        />

        <label htmlFor="StatusCompleto">Completo</label>

        <input
          type="radio"
          name="status"
          value="Pendente"
          id="StatusPendente"
          onChange={() => handleReadingStatus("Pendente")}
        />

        <label htmlFor="StatusPendente">Pendente</label>
      </div>
    </div>
  );
}
