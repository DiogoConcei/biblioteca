import { List, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ViewMode } from '../../../../electron/types/electron-auxiliar.interfaces';
import styles from './ViewModeSelector.module.scss';

interface ViewModeOption {
  value: ViewMode;
  label: string;
  Icon: LucideIcon;
}

const OPTIONS: ViewModeOption[] = [
  { value: ViewMode.LIST, label: 'Lista', Icon: List },
  { value: ViewMode.GALLERY, label: 'Galeria', Icon: LayoutGrid },
  { value: ViewMode.SPOTLIGHT, label: 'Destaque', Icon: ImageIcon },
];

export const VIEW_MODE_LABEL = Object.fromEntries(
  OPTIONS.map((o) => [o.value, o.label]),
) as Record<ViewMode, string>;

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
}

export default function ViewModeSelector({
  value,
  onChange,
  disabled = false,
}: ViewModeSelectorProps) {
  return (
    <div className={styles.viewModeInfo}>
      <h2 className={styles.formSubtitle} id="view-mode-label">
        Modo de exibição:
      </h2>

      <div
        className={styles.optionsContainer}
        role="radiogroup"
        aria-labelledby="view-mode-label"
      >
        {OPTIONS.map(({ value: optionValue, label, Icon }) => {
          const selected = optionValue === value;

          return (
            <button
              key={optionValue}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              className={`${styles.option} ${selected ? styles.selected : ''}`}
              onClick={() => onChange(optionValue)}
              title={label}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
