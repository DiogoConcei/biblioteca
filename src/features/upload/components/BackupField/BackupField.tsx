import { FormInputProps } from '@/features/upload/types/uploadSerieForm.interfaces';
import styles from './BackupField.module.scss'; // Agora usando module.scss

export default function BackupField({ register, error }: FormInputProps) {
  return (
    <div className={styles.backupInfo}>
      <h2 className={styles.formSubtitle}>Adicionar ao auto backup:</h2>

      <div className={styles.backupContainer}>
        <input type="radio" value="Sim" id="SimAutoBackup" {...register} />
        <label htmlFor="SimAutoBackup">Sim</label>

        <input type="radio" value="Não" id="NaoAutoBackup" {...register} />
        <label htmlFor="NaoAutoBackup">Não</label>
      </div>

      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  );
}
