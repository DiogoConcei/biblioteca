import { FormTextInputProps } from '@/shared/types/components.interfaces';

import styles from '@/components/Form/GenericInputs/TextInput/TextInput.module.scss';

export default function TextInput({ register, error, msg }: FormTextInputProps) {
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
