import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { Wallpaper, Plus, Check, Trash2, Trash } from 'lucide-react';
import { useEffect, useState, ReactNode } from 'react';
import BackgroundGallery from '../BackgroundGallery/BackgroundGallery';
import styles from './BackgroundPicker.module.scss';
import useImage from '@/shared/hooks/useImage';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  galleryPath: string;
  children?: ReactNode;
}

export default function BackgroundPicker<T extends FieldValues>({
  control,
  name,
  galleryPath,
  children,
}: Props<T>) {
  const { field } = useController({ name, control });
  const { previewSrc, loadExistingImage, getPreview, encodeImage } = useImage();
  const [open, setIsOpen] = useState(false);
  const current = (field.value as string) ?? '';

  useEffect(() => {
    loadExistingImage(current);
  }, [current, loadExistingImage]);

  return (
    <div className={styles.hero}>
      {previewSrc && <img className={styles.heroImg} src={previewSrc} alt="" />}
      <div className={styles.heroShade} />
      <div className={styles.heroTitle}>{children}</div>

      <div className={styles.heroActions}>
        <button type="button" onClick={() => setIsOpen(true)}>
          <Wallpaper size={16} />
          {current ? 'Trocar fundo' : 'Escolher fundo'}
        </button>
        {current && (
          <button
            type="button"
            className={styles.danger}
            onClick={() => field.onChange('')}
            aria-label="Remover fundo"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {open && (
        <BackgroundGallery
          currentBackground={field.value}
          onClose={() => setIsOpen(false)}
          onSelect={(novaCapa) => {
            field.onChange(novaCapa);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}
