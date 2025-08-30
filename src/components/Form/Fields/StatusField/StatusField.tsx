import { FormInputProps } from '../../../../types/auxiliar.interfaces';
import './StatusField.scss';

export default function StatusField({ register, error }: FormInputProps) {
  return (
    <div className="status-info">
      <h2 className="form-subtitle">Status de leitura:</h2>
      <div className="status-container">
        <input
          type="radio"
          value="Em andamento"
          id="StatusEmAndamento"
          {...register('readingStatus', {
            required: 'Selecione um status',
          })}
        />
        <label htmlFor="StatusEmAndamento">Em andamento</label>

        <input
          type="radio"
          value="Completo"
          id="StatusCompleto"
          {...register('readingStatus')}
        />
        <label htmlFor="StatusCompleto">Completo</label>

        <input
          type="radio"
          value="Pendente"
          id="StatusPendente"
          {...register('readingStatus')}
        />
        <label htmlFor="StatusPendente">Pendente</label>
      </div>
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
