import { Play, RotateCcw } from 'lucide-react';

import useSerieStore from '@/shared/store/useSerieStore';
import styles from './ContinueButton.module.scss';
import { MouseEventHandler } from 'react';

export default function ContinueButton({
  onOpen,
}: {
  onOpen: (e: React.MouseEvent<HTMLButtonElement | SVGElement>) => void;
}) {
  const chapters = useSerieStore((state) => state.chapters);

  const total = chapters.length;
  const readCount = chapters.filter((c) => c.isRead).length;
  const lastRead = chapters.findLast((c) => c.isRead);

  const isFinished = total > 0 && readCount === total;

  let label = 'Começar';
  if (isFinished) label = 'Reler';
  else if (readCount > 0)
    label = `Continuar${lastRead ? ` · Cap. ${lastRead.name}` : ''}`;

  const Icon = isFinished ? RotateCcw : Play;

  return (
    <button
      type="button"
      className={styles.reading}
      onClick={onOpen}
      disabled={total === 0}
    >
      <Icon size={16} fill={isFinished ? 'none' : 'currentColor'} />
      <span className={styles.label}>{label}</span>{' '}
    </button>
  );
}
