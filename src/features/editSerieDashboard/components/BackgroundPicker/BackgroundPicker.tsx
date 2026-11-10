import { useEffect, useRef, useState, ReactNode } from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { Wallpaper, Plus, Check, Trash2 } from 'lucide-react';
import useImage from '@/shared/hooks/useImage';
import styles from './BackgroundPicker.module.scss';

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
  const ref = useRef<HTMLDialogElement>(null);

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [local, setLocal] = useState<{ path: string; src: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = (field.value as string) ?? '';

  useEffect(() => {
    loadExistingImage(current);
  }, [current, loadExistingImage]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPending(current);
    setLoading(true);
    setError(null);

    window.electronAPI.image
      .getBackgroundGallery(galleryPath)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) setGallery(res.data);
        else setError('Falha ao carregar os fundos');
      })
      .catch(() => !cancelled && setError('Falha ao carregar os fundos'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickFromDisk = async () => {
    const path = await getPreview();
    if (!path) return;
    try {
      setLocal({ path, src: await encodeImage(path) });
      setPending(path);
    } catch {
      setError('Não foi possível ler a imagem');
    }
  };

  const confirm = () => {
    field.onChange(pending);
    setOpen(false);
  };

  // a escolhida do computador aparece primeiro, as da galeria vêm depois
  const tiles = [
    ...(local ? [{ value: local.path, src: local.src }] : []),
    ...gallery.map((url) => ({ value: url, src: url })),
  ];

  return (
    <>
      <div className={styles.hero}>
        {previewSrc && <img className={styles.heroImg} src={previewSrc} alt="" />}
        <div className={styles.heroShade} />
        <div className={styles.heroTitle}>{children}</div>

        <div className={styles.heroActions}>
          <button type="button" onClick={() => setOpen(true)}>
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
      </div>

      <dialog
        ref={ref}
        className={styles.modal}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        {open && (
          <div className={styles.content}>
            <h2>Escolher imagem de fundo</h2>

            <div className={styles.grid}>
              <button type="button" className={styles.addTile} onClick={pickFromDisk}>
                <Plus size={28} />
                <span>Do computador</span>
              </button>

              {tiles.map(({ value, src }) => (
                <button
                  key={value}
                  type="button"
                  className={styles.tile}
                  data-selected={value === pending}
                  onClick={() => setPending(value)}
                >
                  <img src={src} alt="" loading="lazy" decoding="async" />
                  {value === pending && <Check size={20} className={styles.check} />}
                </button>
              ))}
            </div>

            {loading && <p className={styles.status}>Carregando…</p>}
            {error && <p className={styles.status}>{error}</p>}
            {!loading && !error && tiles.length === 0 && (
              <p className={styles.status}>Nenhum fundo salvo ainda.</p>
            )}

            <div className={styles.actions}>
              <button type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.primary} onClick={confirm}>
                OK
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
