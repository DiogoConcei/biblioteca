import { FormInputProps } from 'src/types/auxiliar.interfaces';
import './LiteratureField.scss';

export default function LiteratureField({ register, error }: FormInputProps) {
  return (
    <div className="literature-info">
      <h2 className="form-subtitle">Forma de literatura:</h2>
      <div className="form-radio">
        <input
          type="radio"
          value="Manga"
          id="Manga"
          {...register('literatureForm', {
            required: 'Selecione a forma de literatura',
          })}
        />
        <label htmlFor="Manga">Manga</label>

        <input
          type="radio"
          value="Quadrinho"
          id="Quadrinho"
          {...register('literatureForm')}
        />
        <label htmlFor="Quadrinho">Quadrinho</label>

        <input
          type="radio"
          value="Livro"
          id="Livro"
          {...register('literatureForm')}
        />
        <label htmlFor="Livro">Livro</label>
      </div>
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
