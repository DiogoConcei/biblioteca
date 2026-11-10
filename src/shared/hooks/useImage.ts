import { useCallback, useRef, useState } from 'react';

const DIRECT_SRC = /^(data:|https?:|media:|asset:|lib-media:)/;

const encodeImage = (path: string) =>
  window.electronAPI.webUtilities.readFileAsDataUrl(path);

export default function useImage() {
  const [previewSrc, setPreviewSrc] = useState('');
  const requestId = useRef(0);

  const loadExistingImage = useCallback(async (path: string) => {
    const id = ++requestId.current;

    if (!path) {
      setPreviewSrc('');
      return;
    }
    if (DIRECT_SRC.test(path)) {
      setPreviewSrc(path);
      return;
    }

    try {
      const encoded = await encodeImage(path);
      if (id === requestId.current) setPreviewSrc(encoded);
    } catch {
      if (id === requestId.current) setPreviewSrc('');
    }
  }, []);

  const getPreview = async (): Promise<string> => {
    const response = await window.electronAPI.system.pickImage();
    if (!response.success || !response.data) return '';
    return response.data;
  };

  return { previewSrc, setPreviewSrc, loadExistingImage, getPreview, encodeImage };
}
