import { FormInputProps } from '@/features/upload/types/uploadSerieForm.interfaces';
import styles from './PrivacyField.module.scss'; // Atualizado para module.scss

export default function PrivacyField({ register, error }: FormInputProps) {
  return (
    <div className={styles.privacyInfo}>
      <h2 className={styles.formSubtitle}>Privacidade:</h2>

      <div className={styles.privacyContainer}>
        <input type="radio" value="Pública" id="Privacypublic" {...register} />
        <label htmlFor="Privacypublic">Pública</label>

        <input type="radio" value="Privada" id="Privacyprivate" {...register} />
        <label htmlFor="Privacyprivate">Privada</label>
      </div>

      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  );
}
