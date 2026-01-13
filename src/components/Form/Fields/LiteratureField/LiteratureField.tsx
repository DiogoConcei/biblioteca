import { FormInputProps } from 'electron/types/electron-auxiliar.interfaces';
import './LiteratureField.scss';

export default function LiteratureField({
  name,
  register,
  error,
}: FormInputProps) {
  return (
    <div className="literature-info">
      <h2 className="form-subtitle">Forma de literatura:</h2>
      <div className="form-radio">
        <input
          type="radio"
          value="Manga"
          id="Manga"
          {...register(name, {
            required: 'Selecione a forma de literatura',
          })}
        />
        <label htmlFor="Manga">Manga</label>

        <input
          type="radio"
          value="Quadrinho"
          id="Quadrinho"
          {...register(name, {
            required: 'Selecione a forma de literatura',
          })}
        />
        <label htmlFor="Quadrinho">Quadrinho</label>

        <input
          type="radio"
          value="Livro"
          id="Livro"
          {...register(name, {
            required: 'Selecione a forma de literatura',
          })}
        />
        <label htmlFor="Livro">Livro</label>
      </div>
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
