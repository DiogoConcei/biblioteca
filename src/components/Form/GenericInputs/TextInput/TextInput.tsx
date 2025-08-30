import { FormInputProps } from 'src/types/auxiliar.interfaces';
import './TextInput.scss';

export default function TextInput({
  register,
  error,
  name,
  label,
}: FormInputProps) {
  return (
    <div>
      <label>{label}</label>
      <input type="text" {...register(name)} />
      {error && <p>{error.message}</p>}
    </div>
  );
}
