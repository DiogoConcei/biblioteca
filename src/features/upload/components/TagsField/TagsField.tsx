import { useState, KeyboardEvent } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { X } from 'lucide-react';
import styles from './TagsField.module.scss';

export interface TagsFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
}

export default function TagsField<T extends FieldValues>({
  control,
  name,
}: TagsFieldProps<T>) {
  const [draft, setDraft] = useState('');
  const MAX_TAGS = 5;

  return (
    <Controller
      control={control}
      name={name} // Usando a prop name em vez do valor fixo "tags"
      render={({ field }) => {
        const tags: string[] = field.value ?? [];

        const add = (raw: string) => {
          if (tags.length >= MAX_TAGS) return; // Trava a adição se já tiver 5

          const tag = raw.trim();
          const exists = tags.some((t) => t.toLowerCase() === tag.toLowerCase());

          if (tag && !exists) {
            field.onChange([...tags, tag]);
          }
          setDraft('');
        };

        const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
            field.onChange(tags.slice(0, -1));
          }
        };

        return (
          <div className={styles.container}>
            <span className={styles.label}>
              Tags ({tags.length}/{MAX_TAGS})
            </span>

            <div
              className={`${styles.box} ${tags.length >= MAX_TAGS ? styles.disabled : ''}`}
            >
              {tags.map((tag) => (
                <span key={tag} className={styles.chip}>
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remover ${tag}`}
                    onClick={() => field.onChange(tags.filter((t) => t !== tag))}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}

              {/* Esconde o input se atingir o limite */}
              {tags.length < MAX_TAGS && (
                <input
                  value={draft}
                  placeholder={tags.length === 0 ? 'Ex: Ação, Romance...' : ''}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={() => add(draft)}
                />
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
