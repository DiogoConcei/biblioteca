import { useState } from 'react';
import { Tag, XIcon } from 'lucide-react';
import { Controller, FieldValues } from 'react-hook-form';
import { GenericControllerProps } from '../../../../types/auxiliar.interfaces';
import styles from './TagsField.module.scss';

export default function TagsField<T extends FieldValues>({
  control,
  name,
}: GenericControllerProps<T>) {
  const [inputValue, setInputValue] = useState<string>('');

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={styles.tagsInfo}>
          <h2 className={styles.formSubtitle}>Tags:</h2>

          <div className={styles.tagInput}>
            <input
              type="text"
              placeholder="Digite tags separadas por vírgula"
              value={inputValue}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }

                if (e.key === ',') {
                  e.preventDefault();

                  const novaTag = inputValue.trim();
                  if (!novaTag) return;

                  if (!field.value.includes(novaTag)) {
                    field.onChange([...field.value, novaTag]);
                    setInputValue('');
                  }
                }
              }}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => field.onChange(field.value)}
            />
          </div>

          <div className={styles.formTagPreview}>
            <h3 className={styles.formSubtitle}>Tags Inseridas:</h3>

            <ul className={styles.tagList}>
              {field.value.map((tag: string, idx: number) => (
                <li key={idx} className={styles.tagItemWrapper}>
                  <span className={styles.tagItem}>
                    <Tag size={16} className={styles.tagIcon} />

                    <span className={styles.tagText}>{tag}</span>

                    <button
                      type="button"
                      onClick={() => {
                        const novaLista = field.value.filter(
                          (_: string, i: number) => i !== idx,
                        );
                        field.onChange(novaLista);
                      }}
                      className={styles.removeTag}
                      aria-label={`Remover tag ${tag}`}
                    >
                      x
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
