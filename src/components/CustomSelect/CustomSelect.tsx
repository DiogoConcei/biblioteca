import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SelectProps, SelectOption } from '@/types/components.interfaces';

import styles from './CustomSelect.module.scss';

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione',
  disabled = false,
  className = '',
  optionClassName = '',
  dropdownClassName = '',
  searchable = false,
  searchPlaceholder = 'Buscar opção...',
  label,
  renderOption,
}: SelectProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useRef(
    `select-listbox-${Math.random().toString(36).slice(2)}`,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredOptions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    );
  }, [options, search]);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const selectedInFiltered = filteredOptions.findIndex(
      (option) => option.value === value,
    );

    setHighlightedIndex(selectedInFiltered >= 0 ? selectedInFiltered : 0);
  }, [filteredOptions, value]);

  const selectOption = (option: SelectOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((prev) => !prev);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (!filteredOptions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        Math.min(prev + 1, filteredOptions.length - 1),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      selectOption(filteredOptions[highlightedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`${styles.selectRoot} ${className}`} ref={rootRef}>
      {label && <label className={styles.label}>{label}</label>}

      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId.current}
        onKeyDown={handleTriggerKeyDown}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        {selectedOption?.label ?? placeholder}
      </button>

      {isOpen && (
        <div className={`${styles.dropdown} ${dropdownClassName}`}>
          {searchable && (
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          )}

          <ul
            id={listboxId.current}
            role="listbox"
            className={styles.list}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
          >
            {filteredOptions.map((option, index) => {
              const selected = option.value === value;
              const highlighted = index === highlightedIndex;

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={selected}
                  className={`${styles.option} ${selected ? styles.selected : ''} ${highlighted ? styles.highlighted : ''} ${optionClassName}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  {renderOption ? renderOption(option, selected) : option.label}
                </li>
              );
            })}

            {!filteredOptions.length && (
              <li className={styles.emptyState}>Nenhuma opção encontrada.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
