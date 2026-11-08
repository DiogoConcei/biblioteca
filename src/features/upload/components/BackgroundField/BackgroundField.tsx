import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Wallpaper, Trash2, RefreshCw } from 'lucide-react';
import styles from './BackgroundField.module.scss';

interface BackgroundImageFieldProps {
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}

const previewCache = new Map<string, string>();

function resolveFilePath(file: File): string {
  const viaPreload = window.electronAPI?.webUtilities?.getPathForFile(file);
  if (viaPreload) return viaPreload;

  return (file as File & { path?: string }).path ?? '';
}

export default function BackgroundImageField({
  value,
  onChange,
  disabled = false,
}: BackgroundImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = value ? previewCache.get(value) : undefined;

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const sourcePath = resolveFilePath(file);
    if (!sourcePath) {
      console.error('Não foi possível obter o caminho do arquivo.');
      return;
    }

    try {
      const response = await window.electronAPI.image.addToBackgroundGallery(
        '',
        sourcePath,
      );

      if (response.success && response.data) {
        const finalPath = response.data; // Caminho final salvo na galeria pelo backend

        if (!previewCache.has(finalPath)) {
          previewCache.set(finalPath, URL.createObjectURL(file));
        }

        // Atualiza o formulário com o caminho retornado pela API
        onChange(finalPath);
      } else {
        console.error('Falha ao adicionar imagem à galeria:', response.error);
      }
    } catch (error) {
      console.error('Erro ao comunicar com a API do Electron:', error);
    }
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>Imagem de fundo</span>

      <div className={styles.uploadArea} data-has-image={!!preview}>
        {preview ? (
          <>
            <img src={preview} alt="Pré-visualização" className={styles.image} />
            <div className={styles.overlay}>
              <button
                type="button"
                className={styles.actionBtn}
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                title="Trocar imagem"
              >
                <RefreshCw size={20} />
                <span>Trocar</span>
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.danger}`}
                disabled={disabled}
                onClick={() => onChange('')}
                title="Remover imagem"
              >
                <Trash2 size={20} />
                <span>Remover</span>
              </button>
            </div>
          </>
        ) : (
          <div
            className={styles.placeholder}
            onClick={() => !disabled && inputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <Wallpaper size={48} className={styles.icon} />
            <span className={styles.text}>Clique para adicionar um banner de fundo</span>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  );
}
