import { Dispatch } from 'react';
import useUIStore from '../../store/useUIStore';
import useSerieStore from '../../store/useSerieStore';
import styles from './UploadPopUp.module.scss';

export default function UploadPopUp({
  isOpen,
  setIsOpen,
  literatureForm,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<React.SetStateAction<boolean>>;
  literatureForm: string;
}) {
  const setChapters = useSerieStore((s) => s.setChapters);
  const setError = useUIStore((s) => s.setError);
  const dataPath = useSerieStore((s) => s.serie?.dataPath || '');

  const localUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();

    const items = e.target.files;

    if (!items) {
      setError('Nenhum arquivo selecionado para upload.');
      return;
    }

    const filesPath = Array.from(items).map((file: any) => file.path);

    const response = await window.electronAPI.upload.uploadChapter(
      filesPath,
      literatureForm,
      dataPath,
    );

    if (!response.data || !response.success) {
      setError('Erro desconhecido ao fazer upload de capítulos.');
      return;
    }

    const chapters = response.data.sort((a: any, b: any) => a.id - b.id);

    setChapters(chapters);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.text}>
          Adicione mais capítulos à sua série! Para isso, temos duas opções:
          fazer o upload diretamente do seu dispositivo atual ou a partir de
          outro dispositivo utilizando um QR Code.
        </p>

        <div className={styles.actions}>
          <button className={styles.button}>Upload a partir da rede</button>

          <label className={styles.button}>
            Upload local
            <input type="file" hidden multiple onChange={localUpload} />
          </label>
        </div>
      </div>
    </div>
  );
}
