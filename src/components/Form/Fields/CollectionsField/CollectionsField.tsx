import { Controller, FieldValues } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { GenericControllerProps } from '../../../../types/auxiliar.interfaces';
import { Collection } from '../../../../types/collections.interfaces';
import styles from './CollectionsField.module.scss';
import useUIStore from '../../../../store/useUIStore';

export default function CollectionsField<T extends FieldValues>({
  control,
  name,
}: GenericControllerProps<T>) {
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [availableCollections, setAvailableCollections] = useState<string[]>(
    [],
  );
  const setError = useUIStore((state) => state.setError);
  const [newCollection, setNewCollection] = useState('');

  useEffect(() => {
    async function getCollections() {
      try {
        const response = await window.electronAPI.collections.getCollections();

        if (!response.success || !response.data) {
          setError('Falha na requisição');
          return;
        }

        const data = response.data;
        const collNames = data.map((col: Collection) => col.name);

        setAvailableCollections(collNames);
      } catch (e) {
        setError('Falha ao coletar todas as coleções');
      }
    }

    getCollections();
  }, []);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = (field.value ?? []) as string[];

        const toggleCollection = (collection: string) => {
          field.onChange(
            value.includes(collection)
              ? value.filter((c) => c !== collection)
              : [...value, collection],
          );
        };

        const handleButtonClick = () => {
          if (
            isCreatingCollection &&
            newCollection &&
            !availableCollections.includes(newCollection)
          ) {
            field.onChange([...value, newCollection]);
            setAvailableCollections([...availableCollections, newCollection]);
            setNewCollection('');
          }
          setIsCreatingCollection(!isCreatingCollection);
        };

        return (
          <div className={styles.formContainer}>
            <h2 className={styles.subtitle}>Incluir na coleção</h2>

            <div className={styles.collectionList}>
              {availableCollections.map((collection) => {
                const checked = value.includes(collection);

                return (
                  <label
                    key={collection}
                    className={`${styles.collectionItem} ${
                      checked ? styles.checked : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCollection(collection)}
                    />

                    <span className={styles.collectionText}>{collection}</span>
                  </label>
                );
              })}
            </div>

            <div className={styles.addCollection}>
              {isCreatingCollection && (
                <input
                  type="text"
                  value={newCollection}
                  placeholder="Nova coleção"
                  onChange={(e) => setNewCollection(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleButtonClick()}
                />
              )}

              <button type="button" onClick={handleButtonClick}>
                {isCreatingCollection ? 'Salvar coleção' : 'Adicionar coleção'}
              </button>
            </div>
          </div>
        );
      }}
    />
  );
}
