import styles from './CollectionsView.module.scss';
import useClickOutside from '@/shared/hooks/useClickOutside';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import { SerieInCollection } from '@/shared/types/collections.interfaces';
import { Collection } from '@/shared/types/collections.interfaces';
import { X, Bookmark } from 'lucide-react';
import { useState } from 'react';

interface CollectionsViewProps {
  onClose: () => void;
  collections: Collection[];
}

export default function CollectionsView({ onClose, collections }: CollectionsViewProps) {
  const modalRef = useClickOutside<HTMLDivElement>(onClose);
  const [serieForCover, setSerieForCover] = useState<SerieInCollection | null>(null);
  const [isUpdatingCover, setIsUpdatingCover] = useState<boolean>(false);

  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(
    collections.length > 0 ? collections[0] : null,
  );

  const handleConfirmCoverUpdate = async () => {
    if (!selectedCollection || !serieForCover) return;

    setIsUpdatingCover(true);
    try {
      const response = await window.electronAPI.collections.updateCollectionCover(
        selectedCollection.name,
        serieForCover.coverImage,
      );

      if (response.success) {
        selectedCollection.coverImage = serieForCover.coverImage;
        setSerieForCover(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar capa:', error);
    } finally {
      setIsUpdatingCover(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div ref={modalRef} className={styles.modalContent}>
        <header className={styles.header}>
          <h2>Gerenciar Coleções</h2>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            {collections.length === 0 ? (
              <p className={styles.empty}>Nenhuma coleção.</p>
            ) : (
              <ul className={styles.collectionList}>
                {collections.map((collection) => (
                  <li key={collection.name}>
                    <button
                      type="button"
                      className={`${styles.collectionItem} ${selectedCollection?.name === collection.name ? styles.active : ''}`}
                      onClick={() => setSelectedCollection(collection)}
                    >
                      {collection.coverImage ? (
                        <img
                          src={collection.coverImage}
                          alt=""
                          className={styles.coverThumb}
                        />
                      ) : (
                        <div className={`${styles.coverThumb} ${styles.fallbackThumb}`}>
                          <Bookmark size={16} />
                        </div>
                      )}
                      <span className={styles.collectionName}>{collection.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <main className={styles.mainArea}>
            {selectedCollection ? (
              <>
                <header className={styles.mainHeader}>
                  <h3>{selectedCollection.name}</h3>
                  <p>{selectedCollection.description}</p>
                </header>

                {selectedCollection.series.length === 0 ? (
                  <p className={styles.emptyCenter}>Esta coleção está vazia.</p>
                ) : (
                  <div className={styles.seriesGrid}>
                    {selectedCollection.series.map((serie) => (
                      <div
                        key={serie.id}
                        className={styles.serieCard}
                        onClick={() => setSerieForCover(serie)}
                        style={{ cursor: 'pointer' }}
                        title="Clique para definir como capa da coleção"
                      >
                        <img
                          src={serie.coverImage}
                          alt=""
                          className={styles.serieCover}
                        />
                        <span className={styles.serieName} title={serie.name}>
                          {serie.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyCenter}>
                <p>Selecione uma coleção ao lado.</p>
              </div>
            )}

            <ConfirmDialog
              open={serieForCover !== null}
              title={`Definir capa de "${serieForCover?.name}"?`}
              description={`Desta forma, esta imagem se tornará a capa oficial da coleção "${selectedCollection?.name}".`}
              confirmLabel="Definir capa"
              busy={isUpdatingCover}
              onConfirm={handleConfirmCoverUpdate}
              onCancel={() => !isUpdatingCover && setSerieForCover(null)}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
