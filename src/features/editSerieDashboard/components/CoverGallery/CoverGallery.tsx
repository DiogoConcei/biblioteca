import useClickOutside from '@/shared/hooks/useClickOutside';
import styles from './CoverGallery.module.scss';
import Loading from '@/shared/components/Loading/Loading';
import { useUIStore } from '@/shared/store/useUIStore';
import { useEffect, useState } from 'react';
import useSerieStore from '@/shared/store/useSerieStore';
import useImage from '@/shared/hooks/useImage';
import { Plus, Trash, X } from 'lucide-react';
import { SerieGalleryProps } from '../../types/serieGallery.interfaces';
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog';

export default function CoverGallery({
  onClose,
  onSelect,
  currentCover,
}: SerieGalleryProps) {
  const modalRef = useClickOutside<HTMLDivElement>(onClose);
  const serie = useSerieStore((s) => s.serie);
  const { setError, loading } = useUIStore();

  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const askDelete = (e: React.MouseEvent, imgUrl: string) => {
    e.stopPropagation();
    setDeleteError(null);
    setImageToDelete(imgUrl);
  };

  const closeDelete = () => {
    if (!isDeleting) {
      setImageToDelete(null);
      setDeleteError(null);
    }
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await window.electronAPI.image.deleteCover(imageToDelete);

      if (response.success) {
        setGalleryImages((prev) => prev.filter((img) => img !== imageToDelete));

        if (imageToDelete === currentCover) {
          onSelect('');
        }

        setImageToDelete(null);
      } else {
        setDeleteError('Erro ao deletar a capa');
      }
    } catch (error) {
      setDeleteError('Falha na comunicação ao deletar');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div ref={modalRef} className={styles.modalContent}>
        <header className={styles.header}>
          <h2>Capas de {serie.name}</h2>

          <div>
            <button
              type="button"
              onClick={handleAddNewCover}
              className={styles.addButton}
            >
              <Plus size={20} /> Adicionar Capa
            </button>

            <button type="button" onClick={onClose} className={styles.closeButton}>
              <X size={20} />
            </button>
          </div>
        </header>
        <div className={styles.grid}>
          {galleryImages.map((imgUrl, idx) => (
            <div key={imgUrl} className={styles.imageWrapper}>
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

              <button
                type="button"
                className={styles.deleteButton}
                onClick={(e) => askDelete(e, imgUrl)}
                aria-label="Deletar capa"
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>

        <ConfirmDialog
          open={imageToDelete !== null}
          title="Excluir capa permanente?"
          description="Esta imagem será apagada do seu disco e não poderá ser recuperada."
          confirmLabel="Excluir"
          busy={isDeleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={closeDelete}
        />
      </div>
    </div>
  );
}
