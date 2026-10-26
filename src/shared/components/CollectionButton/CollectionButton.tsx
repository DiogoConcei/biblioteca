import { useState } from 'react';
import { List } from 'lucide-react';

import { CollectionButtonProps } from '@/shared/types/components.interfaces';
import useCollection from '@/shared/hooks/useCollection';
import styles from './CollectionButton.module.scss';
import CollectionsView from '../CollectionsView/CollectionsView';

export default function CollectionButton({ serie }: CollectionButtonProps) {
  const { collections, addToCollection } = useCollection();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div>
      <button className={styles.collection} onClick={() => setIsOpen(true)}>
        <List />
      </button>

      {isOpen && <CollectionsView onClose={() => setIsOpen(false)} />}
    </div>
  );
}
