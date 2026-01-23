import { FormTextInputProps } from "electron/types/electron-auxiliar.interfaces";
import "./TextInput.scss";

export default function TextInput({
  register,
  error,
  msg,
}: FormTextInputProps) {
  return (
    <div>
      <input type="text" {...register} placeholder={msg} />
      {error && <p>{error.message}</p>}
    </div>
  );
}
