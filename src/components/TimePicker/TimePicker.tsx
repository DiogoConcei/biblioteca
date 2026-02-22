import { useState, useEffect } from 'react';
import styles from './TimePicker.module.scss';

interface CustomTimePickerProps {
  value: string; // formato "HH:mm"
  onChange: (time: string) => void;
  minuteStep?: number; // permite customizar intervalo
}

export default function TimePicker({
  value,
  onChange,
  minuteStep = 5,
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');

  // sincroniza com valor externo
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(h);
      setMinute(m);
    }
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, '0'),
  );

  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) =>
    String(i * minuteStep).padStart(2, '0'),
  );

  const handleSelect = (newHour: string, newMinute: string) => {
    const formatted = `${newHour}:${newMinute}`;
    setHour(newHour);
    setMinute(newMinute);
    onChange(formatted);
    setIsOpen(false);
  };

  return (
    <div className={styles.timePickerWrapper}>
      <p>Horário de backup</p>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.timePickerButton}
      >
        {hour}:{minute}
      </button>

      {isOpen && (
        <div className={styles.timeDropdown}>
          <div className={styles.timeColumn}>
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => handleSelect(h, minute)}
                className={`${styles.timeButton} ${
                  h === minute ? styles.active : ''
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          <div className={styles.timeColumn}>
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleSelect(hour, m)}
                className={`${styles.timeButton} ${
                  m === minute ? styles.active : ''
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
