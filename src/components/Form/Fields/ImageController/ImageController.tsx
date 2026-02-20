import React, { useEffect, useRef, useState } from 'react';
import { useController } from 'react-hook-form';
import { ImagePlus } from 'lucide-react';
import styles from './ImageController.module.scss';

/* Helpers */
function isAbsolutePathOrFileUrl(p?: string) {
  if (!p) return false;
  if (p.startsWith('file:')) return true;
  if (/^[A-Za-z]:[\\/]/.test(p)) return true;
  if (p.startsWith('/') || p.startsWith('\\')) return true;
  return false;
}

function getElectronAPI() {
  return (window as any).electronAPI ?? (window as any).api ?? undefined;
}

export default function ImageController<T extends Record<string, any>>({
  control,
  name,
}: {
  control: any;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef<number>(0);

  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: 'A capa é obrigatória' },
  });

  const [previewSrc, setPreviewSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    return () => {};
  }, []);

  useEffect(() => {
    const value = field.value as string | undefined;

    if (!value) {
      setPreviewSrc(undefined);
      return;
    }

    if (value.startsWith('data:')) {
      setPreviewSrc(value);
      return;
    }

    if (isAbsolutePathOrFileUrl(value)) {
      const api = getElectronAPI();
      const readFn =
        api?.readFileAsDataUrl ??
        api?.webUtilities?.readFileAsDataUrl ??
        api?.fs?.readFileAsDataUrl ??
        undefined;

      if (!readFn) {
        console.warn(
          'Nenhuma função readFileAsDataUrl disponível no preload; preview desabilitado para paths locais.',
        );
        setPreviewSrc(undefined);
        return;
      }

      const myRequestId = ++requestIdRef.current;
      setPreviewSrc(undefined);

      (async () => {
        try {
          const rawPath = value.startsWith('file://')
            ? decodeURI(value.replace(/^file:\/+/, ''))
            : value;
          const dataUrl: string = await readFn(rawPath);
          if (requestIdRef.current !== myRequestId) return;
          setPreviewSrc(dataUrl);
        } catch (err) {
          console.error('Erro ao ler arquivo no main para preview:', err);
          if (requestIdRef.current === myRequestId) setPreviewSrc(undefined);
        }
      })();

      return;
    }

    setPreviewSrc(undefined);
  }, [field.value]);

  return (
    <div className={styles['image-upload']}>
      <span>Capa</span>

      <div
        className={styles.imageContainer}
        onClick={() => inputRef.current?.click()}
        role="button"
      >
        {previewSrc ? (
          <img
            src={previewSrc}
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
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            try {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string | null;
                if (result) setPreviewSrc(result);
              };
              reader.onerror = (err) => {
                console.error('FileReader error:', err);
              };
              reader.readAsDataURL(file);
            } catch (err) {
              console.error('Erro ao gerar data URL com FileReader:', err);
            }

            const api = getElectronAPI();
            const getPathFn =
              api?.webUtilities?.getPathForFile ??
              api?.getPathForFile ??
              undefined;

            if (getPathFn) {
              try {
                const savedPath: string = await getPathFn(file);
                field.onChange(savedPath);

                const readFn =
                  api?.readFileAsDataUrl ??
                  api?.webUtilities?.readFileAsDataUrl ??
                  api?.fs?.readFileAsDataUrl ??
                  undefined;

                if (readFn) {
                  try {
                    const rawPath = savedPath.startsWith('file://')
                      ? savedPath.replace(/^file:\/+/, '')
                      : savedPath;
                    const dataUrl = await readFn(rawPath);
                    setPreviewSrc(dataUrl);
                  } catch (err) {
                    console.warn(
                      'Não foi possível obter dataURL do path salvo (mantendo preview local):',
                      err,
                    );
                  }
                }
              } catch (err) {
                console.error(
                  'Erro ao salvar arquivo no main e obter path:',
                  err,
                );
              }
            } else {
              console.warn(
                'Nenhuma função getPathForFile exposta no preload; path não salvo automaticamente.',
              );
            }
          }}
        />
      </div>

      {fieldState.error && (
        <p className={styles.error}>{fieldState.error.message}</p>
      )}
    </div>
  );
}
