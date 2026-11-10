import { FormTextInputProps } from '@/features/upload/types/uploadSerieForm.interfaces';
import styles from './TextInput.module.scss';

type Props = FormTextInputProps & { compact?: boolean };

export default function TextInput({ register, error, msg, compact = false }: Props) {
  return (
    <div>
      <input
        type="text"
        {...register}
        placeholder={msg}
        className={`${styles.genericInput} ${compact ? styles.compact : ''}`}
      />
      {error && <p className={styles.error}>{error.message}</p>}
    </div>
  );
}
