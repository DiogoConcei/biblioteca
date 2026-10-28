import { useState, KeyboardEvent } from 'react';
import { Controller, Control } from 'react-hook-form';
import { X } from 'lucide-react';
import { SerieEditForm } from '@/shared/types/series.interfaces';
import styles from './TagsField.module.scss';

export default function TagsField({ control }: { control: Control<SerieEditForm> }) {
  const [draft, setDraft] = useState('');

  return (
    <Controller
      control={control}
      name="tags"
      render={({ field }) => {
        const tags: string[] = field.value ?? [];

        const add = (raw: string) => {
          const tag = raw.trim();
          const exists = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
          if (tag && !exists) field.onChange([...tags, tag]);
          setDraft('');
        };

        const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            field.onChange(tags.slice(0, -1));
          }
        };

        return (
          <div className={styles.box}>
            {tags.map((tag) => (
              <span key={tag} className={styles.chip}>
                {tag}
                <button
                  type="button"
                  aria-label={`Remover ${tag}`}
                  onClick={() => field.onChange(tags.filter((t) => t !== tag))}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              value={draft}
              placeholder="Adicionar tag"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => add(draft)}
            />
          </div>
        );
      }}
    />
  );
}
