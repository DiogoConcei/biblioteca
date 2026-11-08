import { useState, useEffect } from 'react';
import { X, Bookmark, Plus } from 'lucide-react';
import styles from './CollectionsPreView.module.scss';
import useClickOutside from '@/shared/hooks/useClickOutside';
import { Collection } from '@/shared/types/collections.interfaces';
import { useUIStore } from '../../../../shared/store/useUIStore';

interface CollectionsViewProps {
  onClose: () => void;
  selectedCollections: string[];
  onToggleCollection: (collectionName: string) => void;
  // Opcional, para atualizar os nomes no CollectionsField de imediato sem recarregar tudo
  onCollectionCreated?: (collectionName: string) => void;
}

export default function CollectionsView({
  onClose,
  selectedCollections,
  onToggleCollection,
  onCollectionCreated,
}: CollectionsViewProps) {
  const modalRef = useClickOutside<HTMLDivElement>(onClose);
  const setError = useUIStore((state) => state.setError);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Busca as coleções completas (com as imagens de capa)
  const fetchCollections = async () => {
    try {
      const response = await window.electronAPI.collections.getCollections();
      if (response.success && response.data) {
        setCollections(response.data);
      } else {
        setError('Falha ao carregar as coleções.');
      }
    } catch (e) {
      setError('Erro ao carregar coleções.');
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateCollection = async () => {
    const trimmedName = newCollectionName.trim();
    if (!trimmedName || isCreating) return;

    // Evita duplicatas locais
    if (collections.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setNewCollectionName('');
      return;
    }

    setIsCreating(true);
    try {
      // 1. Você pode disparar a criação pro backend aqui (ajuste para sua API real)
      // await window.electronAPI.collections.createCollection(trimmedName);

      // 2. Atualiza a lista local
      await fetchCollections();

      // 3. Adiciona a nova coleção diretamente na série atual
      onToggleCollection(trimmedName);

      if (onCollectionCreated) {
        onCollectionCreated(trimmedName);
      }

      setNewCollectionName('');
    } catch (error) {
      setError('Erro ao criar nova coleção.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div ref={modalRef} className={styles.modalContent}>
        <header className={styles.header}>
          <h2>Adicionar à Coleção</h2>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </header>

        <div className={styles.createSection}>
          <input
            type="text"
            placeholder="Nome da nova coleção..."
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateCollection();
            }}
          />
          <button
            type="button"
            onClick={handleCreateCollection}
            disabled={!newCollectionName.trim() || isCreating}
          >
            {isCreating ? 'Criando...' : 'Criar e Adicionar'}
          </button>
        </div>

        <main className={styles.grid}>
          {collections.length === 0 ? (
            <p className={styles.empty}>Nenhuma coleção encontrada.</p>
          ) : (
            collections.map((collection) => {
              const isActive = selectedCollections.includes(collection.name);

              return (
                <button
                  key={collection.name}
                  type="button"
                  className={`${styles.collectionCard} ${isActive ? styles.active : ''}`}
                  onClick={() => onToggleCollection(collection.name)}
                >
                  {collection.coverImage ? (
                    <img
                      src={collection.coverImage}
                      alt=""
                      className={styles.coverThumb}
                    />
                  ) : (
                    <div className={`${styles.coverThumb} ${styles.fallbackThumb}`}>
                      <Bookmark size={32} />
                    </div>
                  )}
                  <span className={styles.collectionName} title={collection.name}>
                    {collection.name}
                  </span>
                </button>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
