import { FormInputProps } from '../../../../types/auxiliar.interfaces';
import './BackupField.scss';

export default function BackupField({ register, error }: FormInputProps) {
  return (
    <div className="backup-info">
      <h2 className="form-subtitle">Adicionar ao auto backup:</h2>
      <div className="backup-container">
        <input
          type="radio"
          value="Sim"
          id="SimAutoBackup"
          {...register('autoBackup', {
            required: 'Escolha Sim ou Não',
          })}
        />
        <label htmlFor="SimAutoBackup">Sim</label>

        <input
          type="radio"
          value="Não"
          id="NaoAutoBackup"
          {...register('autoBackup')}
        />
        <label htmlFor="NaoAutoBackup">Não</label>
      </div>
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
