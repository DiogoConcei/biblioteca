import styles from './CollectionsView.module.scss';
import useClickOutside from '@/shared/hooks/useClickOutside';
import { Collection } from '@/shared/types/collections.interfaces';
import { X, Bookmark } from 'lucide-react';
import { useState } from 'react';

interface CollectionsViewProps {
  onClose: () => void;
  collections: Collection[];
}

export default function CollectionsView({ onClose, collections }: CollectionsViewProps) {
  const modalRef = useClickOutside<HTMLDivElement>(onClose);

  // O estado guarda a coleção inteira. Por padrão, seleciona a primeira da lista (se existir).
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(
    collections.length > 0 ? collections[0] : null,
  );

  return (
    <div className={styles.overlay}>
      <div ref={modalRef} className={styles.modalContent}>
        <header className={styles.header}>
          <h2>Gerenciar Coleções</h2>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </header>

        {/* Divisão do Layout (Master-Detail) */}
        <div className={styles.layout}>
          {/* Menu Lateral (Master) */}
          <aside className={styles.sidebar}>
            {collections.length === 0 ? (
              <p className={styles.empty}>Nenhuma coleção.</p>
            ) : (
              <ul className={styles.collectionList}>
                {collections.map((collection) => (
                  <li key={collection.name}>
                    <button
                      type="button"
                      // Aplica a classe .active se for a coleção selecionada no momento
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

          {/* Área Central (Detalhe) */}
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
                      <div key={serie.id} className={styles.serieCard}>
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
          </main>
        </div>
      </div>
    </div>
  );
}
