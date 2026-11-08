import { Controller, FieldValues } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { LibraryBig } from 'lucide-react'; // Ícone legal para coleções

import { GenericControllerProps } from '@/features/upload/types/uploadSerieForm.interfaces';
import { Collection } from '@/shared/types/collections.interfaces';
import styles from './CollectionsField.module.scss';
import CollectionsPreView from '@/features/upload/components/CollectionsPreView/CollectionsPreView';
import { useUIStore } from '../../../../shared/store/useUIStore';

// IMPORT DO SEU MODAL AQUI:
// import CollectionsView from './CollectionsView';

export default function CollectionsField<T extends FieldValues>({
  control,
  name,
}: GenericControllerProps<T>) {
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const setError = useUIStore((state) => state.setError);

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
  }, [setError, isModalOpen]); // Atualiza a lista sempre que o modal for fechado

  return (
    <>
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

          return (
            <div className={styles.collectionsInfo}>
              <h2 className={styles.formSubtitle}>Incluir na coleção:</h2>

              <div className={styles.container}>
                <div className={styles.collectionList}>
                  {availableCollections.map((collection) => {
                    const checked = value.includes(collection);

                    return (
                      <label
                        key={collection}
                        className={`${styles.collectionItem} ${checked ? styles.checked : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCollection(collection)}
                        />
                        <span>{collection}</span>
                      </label>
                    );
                  })}

                  {availableCollections.length === 0 && (
                    <span style={{ color: 'rgba(252, 247, 248, 0.6)' }}>
                      Nenhuma coleção disponível.
                    </span>
                  )}
                </div>

                <div className={styles.manageAction}>
                  <button type="button" onClick={() => setIsModalOpen(true)}>
                    <LibraryBig size={18} />
                    Gerenciar Coleções
                  </button>
                </div>
              </div>

              {isModalOpen && (
                <CollectionsPreView
                  onClose={() => setIsModalOpen(false)}
                  selectedCollections={value} // O 'value' do field do react-hook-form
                  onToggleCollection={toggleCollection} // A função toggle que já existe aí
                  onCollectionCreated={(newName) => {
                    // Garante que o nome apareça na listinha logo que fechar o modal
                    if (!availableCollections.includes(newName)) {
                      setAvailableCollections((prev) => [...prev, newName]);
                    }
                  }}
                />
              )}
            </div>
          );
        }}
      />
    </>
  );
}
