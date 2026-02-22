import { useState } from 'react';
import { List } from 'lucide-react';
import { CollectionButtonProps } from '../../types/components.interfaces';
import useCollection from '../../hooks/useCollection';
import styles from './CollectionButton.module.scss';

export default function CollectionButton({
  dataPath,
  serieData,
}: CollectionButtonProps) {
  const { collections, addToCollection } = useCollection();
  const [isAdd, setIsAdd] = useState<boolean>(false);

  const filterCollections = [...collections]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  const onToggle = () => {
    setIsAdd((prevState) => !prevState);
  };

  return (
    <div>
      <button className={styles.collection} onClick={onToggle}>
        <List />
        Coleção
      </button>

      {isAdd && (
        <ul className={styles['dropdown-list']}>
          {filterCollections.map((collection) => (
            <li key={collection.name} className={styles['dropdown-item']}>
              <button
                className={styles['dropdown-option']}
                onClick={() =>
                  addToCollection(dataPath, collection.name, serieData)
                }
              >
                {collection.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
