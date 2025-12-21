import { useState, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { ImagePlus } from 'lucide-react';
import { GenericControllerProps } from '../../../../types/auxiliar.interfaces';
import { FieldValues } from 'react-hook-form';
import styles from './ImageController.module.scss';

export default function ImageController<T extends FieldValues>({
  control,
  name,
}: GenericControllerProps<T>) {
  const [preview, setPreview] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: 'A capa é obrigatória' }}
      render={({ field, fieldState }) => (
        <div className={styles['image-upload']}>
          <span>Capa</span>
          <div
            className={styles.imageContainer}
            onClick={() => inputRef.current?.click()}
          >
            {preview || field.value ? (
              <img
                src={preview || field.value}
                alt="Preview da capa"
                className={styles.coverPreview}
              />
            ) : (
              <div className={styles.placeholder}>
                <ImagePlus size={48} />
                <span>Clique para adicionar</span>
              </div>
            )}

            <input
              ref={inputRef}
              id="coverInput"
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result as string);
                reader.readAsDataURL(file);

                const path =
                  await window.electronAPI.webUtilities.getPathForFile(file);
                field.onChange(path);
              }}
            />
          </div>

          {fieldState.error && (
            <p className={styles.error}>{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
