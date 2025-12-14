import { Controller, FieldValues } from 'react-hook-form';
import { useState } from 'react';
import { GenericControllerProps } from '../../../../types/auxiliar.interfaces';
import styles from './CollectionsField.module.scss';

export default function CollectionsField<T extends FieldValues>({
  control,
  name,
}: GenericControllerProps<T>) {
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [availableCollections, setAvailableCollections] = useState<string[]>(
    [],
  );
  const [newCollection, setNewCollection] = useState('');

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = (field.value ?? []) as string[];

        const allCollections = Array.from(
          new Set([...availableCollections, ...value]),
        );

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

            {/* ===== LISTA DE COLEÇÕES ===== */}
            <div className={styles.collectionList}>
              {allCollections.map((collection) => {
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

            {/* ===== ADD NOVA COLEÇÃO ===== */}
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
