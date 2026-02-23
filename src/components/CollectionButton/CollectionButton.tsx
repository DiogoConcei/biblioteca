import { useMemo } from 'react';
import { List } from 'lucide-react';
import CustomSelect from '../CustomSelect/CustomSelect';
import { CollectionButtonProps } from '../../types/components.interfaces';
import useCollection from '../../hooks/useCollection';
import styles from './CollectionButton.module.scss';

export default function CollectionButton({
  dataPath,
  serieData,
}: CollectionButtonProps) {
  const { collections, addToCollection } = useCollection();

  const filterCollections = useMemo(
    () =>
      [...collections]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 5)
        .map((collection) => ({
          value: collection.name,
          label: collection.name,
        })),
    [collections],
  );

  return (
    <div className={styles.collectionWrapper}>
      <div className={styles.collectionTitle}>
        <List />
        <span>Coleção</span>
      </div>

      <CustomSelect
        options={filterCollections}
        placeholder="Selecionar coleção"
        onChange={(value) =>
          addToCollection(dataPath, String(value), serieData)
        }
      />
    </div>
  );
}
