import useClickOutside from '@/shared/hooks/useClickOutside';
import styles from './SerieGallery.module.scss';
import Loading from '@/shared/components/Loading/Loading';
import { useUIStore } from '@/shared/store/useUIStore';
import { useEffect, useState } from 'react';
import useSerieStore from '@/shared/store/useSerieStore';
import useImage from '@/shared/hooks/useImage';
import { Plus } from 'lucide-react';

interface SerieGalleryProps {
  onClose: () => void;
  onSelect: (imagePath: string) => void;
}

export default function SerieGallery({ onClose, onSelect }: SerieGalleryProps) {
  const modalRef = useClickOutside<HTMLDivElement>(onClose);
  const serie = useSerieStore((s) => s.serie);
  const { setError, loading } = useUIStore();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const { getPreview } = useImage();

  if (!serie || loading) return <Loading />;

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
            <img
              key={idx}
              src={imgUrl}
              alt={`Capa ${idx}`}
              onClick={() => onSelect(imgUrl)}
              role="button"
              className={styles.clickableImage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
