import { FormInputProps } from '@/features/upload/types/uploadSerieForm.interfaces';
import styles from './LiteratureField.module.scss'; // Atualizado para module

export default function LiteratureField({ register, error }: FormInputProps) {
  return (
    <div className={styles.literatureInfo}>
      <h2 className={styles.formSubtitle}>Forma de literatura:</h2>

      <div className={styles.formRadio}>
        <input type="radio" value="Manga" id="Manga" {...register} />
        <label htmlFor="Manga">Manga</label>

        <input type="radio" value="Quadrinho" id="Quadrinho" {...register} />
        <label htmlFor="Quadrinho">Quadrinho</label>

        <input type="radio" value="Books" id="Books" {...register} />
        <label htmlFor="Books">Livro</label>
      </div>

      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  );
}
