import { Tag } from 'lucide-react';
import { Controller, FieldValues } from 'react-hook-form';
import { GenericControllerProps } from '../../../../types/auxiliar.interfaces';
import './TagsField.scss';

export default function TagsField<T extends FieldValues>({
  control,
  name,
}: GenericControllerProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="tags-info">
          <h2 className="form-subtitle">Tags:</h2>
          <div className="tag-input">
            <input
              type="text"
              placeholder="Digite tags separadas por vírgula"
              value={field.value.join(', ')}
              onChange={(e) => {
                const tagArray = e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter((t) => t !== '');
                field.onChange(tagArray);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              onBlur={() => {
                field.onChange(field.value);
              }}
            />
          </div>
          <div className="form-tag-preview">
            <h3 className="form-subtitle">Tags Inseridas:</h3>
            <ul className="tag-list">
              {field.value.map((tag: string, idx: number) => (
                <li key={idx}>
                  <span>
                    <Tag size={16} /> {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const novaLista = field.value.filter(
                          (_: string, i: number) => i !== idx,
                        );
                        field.onChange(novaLista);
                      }}
                      className="remove-tag"
                      aria-label={`Remover tag ${tag}`}
                    >
                      &times;
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    />
  );
}
