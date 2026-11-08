import { FormInputProps } from '@/features/upload/types/uploadSerieForm.interfaces';
import styles from './StatusField.module.scss'; // Atualizado para module.scss

export default function StatusField({ register, error }: FormInputProps) {
  return (
    <div className={styles.statusInfo}>
      <h2 className={styles.formSubtitle}>Status de leitura:</h2>

      <div className={styles.statusContainer}>
        <input type="radio" value="Em andamento" id="StatusEmAndamento" {...register} />
        <label htmlFor="StatusEmAndamento">Em andamento</label>

        <input type="radio" value="Completo" id="StatusCompleto" {...register} />
        <label htmlFor="StatusCompleto">Completo</label>

        <input type="radio" value="Pendente" id="StatusPendente" {...register} />
        <label htmlFor="StatusPendente">Pendente</label>
      </div>

      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  );
}
