import { useMemo, useState } from 'react';
import { FolderPlus } from 'lucide-react';

import { CollectionButtonProps } from '@/shared/types/components.interfaces';
import useCollection from '@/shared/hooks/useCollection';
import CollectionsView from '@/shared/components/CollectionsView/CollectionsView';
import styles from './QuicklyCollections.module.scss';

const MAX_VISIBLE_COVERS = 3;

export default function QuicklyCollections({ serie }: CollectionButtonProps) {
  const { collections } = useCollection();
  const [isOpen, setIsOpen] = useState(false);

  const activeCollections = useMemo(() => {
    if (!collections || !serie) return [];
    return collections.filter((c) => c.series.some((s) => s.id === serie.id));
  }, [collections, serie]);

  const count = activeCollections.length;
  const hasCollections = count > 0;
  const visible = activeCollections.slice(0, MAX_VISIBLE_COVERS);
  const extra = count - visible.length;

  const label = !hasCollections
    ? 'Coleções'
    : count === 1
      ? activeCollections[0].name
      : `${count} coleções`;

  const tooltip = hasCollections
    ? activeCollections.map((c) => c.name).join(', ')
    : 'Adicionar a uma coleção';

  return (
    <>
      <button
        type="button"
        className={`${styles.root} ${hasCollections ? styles.active : styles.empty}`}
        onClick={() => setIsOpen(true)}
        aria-label="Gerenciar coleções"
        title={tooltip}
      >
        {hasCollections ? (
          <div className={styles.stack}>
            {visible.map((c, i) => (
              <img
                key={c.id}
                src={c.coverImage}
                alt=""
                className={styles.cover}
                style={{ zIndex: visible.length - i }}
              />
            ))}
            {extra > 0 && <span className={styles.extra}>+{extra}</span>}
          </div>
        ) : (
          <FolderPlus size={18} className={styles.icon} />
        )}

        <span className={styles.label}>{label}</span>
      </button>

      {isOpen && (
        <CollectionsView collections={collections} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
