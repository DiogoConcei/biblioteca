import { useEffect, useState } from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { useUIStore } from '@/shared/store/useUIStore';
import { ImagePlus } from 'lucide-react';
import useImage from '@/shared/hooks/useImage';
import styles from './ImageController.module.scss';

export default function ImageController<T extends FieldValues>({
  control,
  name,
  sourcePath,
}: {
  control: Control<T>;
  name: Path<T>;
  sourcePath: string;
}) {
  const { previewSrc, getPreview, loadExistingImage } = useImage();
  const [suggestCovers, setSuggestCovers] = useState<string[]>([]);
  const setError = useUIStore((s) => s.setError);

  const { field, fieldState } = useController({ name, control });

  // Sincroniza o preview inicial caso já exista valor no form
  useEffect(() => {
    if (field.value) {
      loadExistingImage(field.value);
    }
  }, [field.value, loadExistingImage]);

  useEffect(() => {
    async function getSuggestCovers() {
      try {
        const response = await window.electronAPI.upload.suggestCovers(sourcePath);

        if (response.success && response.data) {
          // response.data é um array de SuggestedCover.
          // Fazemos um map para extrair apenas a propriedade 'url' de cada objeto.
          const urls = response.data.map((cover) => cover.url);
          setSuggestCovers(urls);
        }
      } catch (e) {
        setError('Erro ao carregar galeria');
      }
    }

    // Só executa se sourcePath existir
    if (sourcePath) {
      getSuggestCovers();
    }
  }, [sourcePath, setError]);

  return (
    <div className={styles['image-upload']}>
      <span>Capa</span>

      {/* Quadro Principal */}
      <div
        className={styles.imageContainer}
        onClick={async () => {
          const image = await getPreview();
          if (!image) return;
          field.onChange(image);
        }}
        role="button"
      >
        {previewSrc ? (
          <img src={previewSrc} alt="Preview da capa" className={styles.coverPreview} />
        ) : (
          <div className={styles.placeholder}>
            <ImagePlus size={48} />
            <span>Clique para adicionar do PC</span>
          </div>
        )}
      </div>
      {fieldState.error && <p className={styles.error}>{fieldState.error.message}</p>}

      {/* Galeria de Sugestões (Adicione estilos no seu SCSS para alinhar isso) */}
      {suggestCovers.length > 0 && (
        <div className={styles.suggestionsGallery}>
          {suggestCovers.map((coverImg, index) => (
            <img
              key={index}
              src={coverImg}
              alt="Sugestão de capa"
              onClick={(e) => {
                e.stopPropagation(); // Evita conflito com o clique do container pai, se houver
                field.onChange(coverImg); // Atualiza o formulário
                loadExistingImage(coverImg); // Atualiza o quadro principal
              }}
              style={{ width: 80, height: 120, cursor: 'pointer', objectFit: 'cover' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
