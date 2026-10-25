import useClickOutside from '@/shared/hooks/useClickOutside';
import styles from './SerieGallery.module.scss';
import Loading from '@/shared/components/Loading/Loading';
import { useUIStore } from '@/shared/store/useUIStore';
import { useEffect, useState } from 'react';
import useSerieStore from '@/shared/store/useSerieStore';
import useImage from '@/shared/hooks/useImage';
import { Plus, Trash } from 'lucide-react';

interface SerieGalleryProps {
  currentCover: string; // <-- Para saber qual é a capa atual do form
  onClose: () => void;
  onSelect: (imagePath: string) => void;
}

export default function SerieGallery({
  onClose,
  onSelect,
  currentCover,
}: SerieGalleryProps) {
  const modalRef = useClickOutside<HTMLDivElement>(onClose);
  const serie = useSerieStore((s) => s.serie);
  const { setError, loading } = useUIStore();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const { getPreview } = useImage();

  useEffect(() => {
    async function getCoverGallery() {
      if (!serie) return;
      try {
        const response = await window.electronAPI.image.getCoverGallery(
          serie.coverGallery,
        );
        if (response.success && response.data) {
          setGalleryImages(response.data);
        }
      } catch (e) {
        setError('Erro ao carregar galeria');
      }
    }
    getCoverGallery();
  }, [serie, setError]);

  if (!serie || loading) return <Loading />;

  const handleAddNewCover = async () => {
    try {
      const pickedPath = await getPreview();
      if (!pickedPath) return;

      const response = await window.electronAPI.image.addCoverToGallery(
        serie.coverGallery,
        pickedPath,
      );

      if (response.success && response.data) {
        const newMediaUrl = response.data;

        setGalleryImages((prev) => [...prev, newMediaUrl]);

        onSelect(newMediaUrl);
      }
    } catch (e) {
      setError('Erro ao adicionar nova capa');
    }
  };

  // NOVA FUNÇÃO: O handler do clique da lixeira
  const handleDelete = async (e: React.MouseEvent, imgUrl: string) => {
    e.stopPropagation(); // 🔴 CRÍTICO: Impede que o clique na lixeira selecione a imagem como capa

    try {
      // IPC que você vai criar!
      const response = await window.electronAPI.image.deleteCover(imgUrl);

      if (response.success) {
        // Remove visualmente da grade
        setGalleryImages((prev) => prev.filter((img) => img !== imgUrl));

        // Se o usuário apagou a capa que estava ativa no form, nós limpamos o campo
        if (imgUrl === currentCover) {
          onSelect('');
        }
      } else {
        setError('Erro ao deletar a capa');
      }
    } catch (error) {
      setError('Falha na comunicação ao deletar');
    }
  };

  return (
    <div className={styles.overlay}>
      <div ref={modalRef} className={styles.modalContent}>
        <header className={styles.header}>
          <h2>Capas de {serie.name}</h2>

          <button type="button" onClick={handleAddNewCover} className={styles.addButton}>
            <Plus size={20} /> Adicionar Capa
          </button>
        </header>
        <div className={styles.grid}>
          {galleryImages.map((imgUrl, idx) => (
            <div key={imgUrl} className={styles.imageWrapper}>
              {/* Botão Principal: Selecionar a Capa */}
              <button
                type="button"
                className={`${styles.coverButton} ${imgUrl === currentCover ? styles.active : ''}`}
                onClick={() => onSelect(imgUrl)}
                aria-label={`Selecionar capa ${idx + 1}`}
              >
                <img
                  src={imgUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={styles.cover}
                />
              </button>

              {/* Botão Secundário: Deletar a Capa */}
              <button
                type="button"
                className={styles.deleteButton}
                onClick={(e) => handleDelete(e, imgUrl)}
                aria-label="Deletar capa"
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>{' '}
      </div>
    </div>
  );
}
