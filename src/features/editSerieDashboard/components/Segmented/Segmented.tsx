import { Controller, Control } from 'react-hook-form';
import { SerieEditForm } from '@/shared/types/series.interfaces';
import styles from './Segmented.module.scss';

type SegmentedName = 'metadata.status' | 'metadata.privacy' | 'metadata.autoBackup';

export default function Segmented({
  control,
  name,
  label,
  options,
}: {
  control: Control<SerieEditForm>;
  name: SegmentedName;
  label: string;
  options: string[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={styles.field}>
          <span className={styles.label}>{label}</span>
          <div className={styles.segmented} role="radiogroup" aria-label={label}>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={field.value === opt}
                data-active={field.value === opt}
                data-dirty={fieldState.isDirty}
                onClick={() => field.onChange(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    />
  );
}
