import { FormTextInputProps } from 'src/types/auxiliar.interfaces';
import './TextInput.scss';

export default function TextInput({
  register,
  error,
  name,
  msg,
}: FormTextInputProps) {
  return (
    <div>
      <input type="text" {...register(name)} placeholder={msg} />
      {error && <p>{error.message}</p>}
    </div>
  );
}
