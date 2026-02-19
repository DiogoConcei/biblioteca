import { FormTextInputProps } from 'electron/types/electron-auxiliar.interfaces';
import styles from './TextInput.module.scss';

export default function TextInput({
  register,
  error,
  msg,
}: FormTextInputProps) {
  return (
    <div>
      <input
        type="text"
        {...register}
        placeholder={msg}
        className={styles.genericInput}
      />
      {error && <p>{error.message}</p>}
    </div>
  );
}
