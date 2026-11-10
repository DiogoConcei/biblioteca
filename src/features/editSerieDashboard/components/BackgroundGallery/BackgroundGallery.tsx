import useSerieStore from '@/shared/store/useSerieStore';
import { useUIStore } from '@/shared/store/useUIStore';
import useImage from '@/shared/hooks/useImage';
import useClickOutside from '@/shared/hooks/useClickOutside';
import { useState, useEffect } from 'react';
import Loading from '@/shared/components/Loading/Loading';
import ConfirmDialog from '@/shared/components/ConfirmDialog/ConfirmDialog';

import { X, Plus, Trash } from 'lucide-react';

import styles from './BackgroundGallery.module.scss';

export interface Props {
  currentBackground: string;
  onClose: () => void;
  onSelect: (imagePath: string) => void;
}

export default function BackgroundGallery({
  currentBackground,
  onClose,
  onSelect,
}: Props) {
  const [backgroundGallery, setBackgroundGallery] = useState<string[]>([]);
  const [local, setLocal] = useState<{ path: string; src: string } | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const serie = useSerieStore((s) => s.serie);
  const { getPreview } = useImage();

  const modalRef = useClickOutside<HTMLDivElement>(onClose);
  const { setError, loading } = useUIStore();

  useEffect(() => {
    async function getCoverGallery() {
      if (!serie) return;
      try {
        const response = await window.electronAPI.image.getBackgroundGallery(
          serie.backgroundGallery,
        );
        if (response.success && response.data) {
          setBackgroundGallery(response.data);
        }
      } catch (e) {
        setError('Erro ao carregar galeria');
      }
    }
    getCoverGallery();
  }, [serie, setError]);

  const askDelete = (e: React.MouseEvent, imgUrl: string) => {
    e.stopPropagation();
    setDeleteError(null);
    setImageToDelete(imgUrl);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await window.electronAPI.image.deleteCover(imageToDelete);

      if (response.success) {
        setBackgroundGallery((prev) => prev.filter((img) => img !== imageToDelete));

        if (imageToDelete === currentBackground) {
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

  const closeDelete = () => {
    if (!isDeleting) {
      setImageToDelete(null);
      setDeleteError(null);
    }
  };

  const handleAddNewBackground = async () => {
    const pickedPath = await getPreview();
    if (!pickedPath) return;
    onSelect(pickedPath);
  };

  const tiles = [
    ...(local ? [{ value: local.path, src: local.src }] : []),
    ...backgroundGallery.map((url) => ({ value: url, src: url })),
  ];

  if (!serie || loading) return <Loading />;

  return (
    <div className={styles.overlay}>
      <div ref={modalRef} className={styles.modalContent}>
        <header className={styles.header}>
          <h2>Capas de fundo de {serie.name}</h2>

          <div>
            <button type="button" onClick={onClose} className={styles.closeButton}>
              <X size={20} />
            </button>
          </div>
        </header>

        <button type="button" className={styles.addTile} onClick={handleAddNewBackground}>
          <Plus size={28} />
          <span>Do computador</span>
        </button>

        <div className={styles.grid}>
          {tiles.map(({ value, src }) => (
            <div key={value} className={styles.ImageWrapper}>
              <button key={value} type="button" className={styles.tile}>
                <img src={src} alt="" loading="lazy" decoding="async" />
              </button>

              <button
                type="button"
                className={styles.deleteButton}
                onClick={(e) => askDelete(e, value)}
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
