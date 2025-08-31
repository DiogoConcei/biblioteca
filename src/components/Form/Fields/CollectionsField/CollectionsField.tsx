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

        // Junta as coleções disponíveis com as que já estão no form, sem duplicatas
        const allCollections = Array.from(
          new Set([...availableCollections, ...value]),
        );

        const handleCheckboxChange = (collection: string, checked: boolean) => {
          const updated = checked
            ? [...value, collection]
            : value.filter((c) => c !== collection);
          field.onChange(updated);
        };

        const handleButtonClick = () => {
          if (
            isCreatingCollection &&
            newCollection &&
            !availableCollections.includes(newCollection)
          ) {
            const updatedCollections = [...value, newCollection];
            field.onChange(updatedCollections);
            setAvailableCollections([...availableCollections, newCollection]);
            setNewCollection('');
          }
          setIsCreatingCollection(!isCreatingCollection);
        };

        return (
          <div className={styles['form-container']}>
            <h2 className={styles.subtitle}>Incluir na coleção:</h2>

            <div className={styles['form-collection']}>
              {allCollections.map((collection, index) => (
                <span key={index}>
                  <input
                    type="checkbox"
                    value={collection}
                    checked={value.includes(collection)}
                    onChange={(e) =>
                      handleCheckboxChange(collection, e.target.checked)
                    }
                  />
                  <label className={styles.collectionName}>{collection}</label>
                </span>
              ))}
            </div>

            <div className={styles['form-add-collection']}>
              {isCreatingCollection && (
                <input
                  type="text"
                  value={newCollection}
                  placeholder="Digite o nome da nova coleção"
                  onChange={(e) => setNewCollection(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleButtonClick()}
                />
              )}

              <button type="button" onClick={handleButtonClick}>
                {isCreatingCollection ? 'Salvar Coleção' : 'Adicionar coleção'}
              </button>
            </div>
          </div>
        );
      }}
    />
  );
}
