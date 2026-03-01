import { useState } from 'react';

export default function useImage() {
  const [previewSrc, setPreviewSrc] = useState<string | null>('');

  const getPreview = async (): Promise<string> => {
    const imagePath = await pickImage();

    if (!imagePath) return '';

    const encodedImage = await encodeImage(imagePath);
    setPreviewSrc(encodedImage);
    return imagePath;
  };

  const pickImage = async (): Promise<string | null> => {
    const bridge = (
      window as Window & {
        electron?: {
          dialog?: { openFile?: () => Promise<string | undefined> };
        };
      }
    ).electron;

    if (bridge?.dialog?.openFile) {
      const pickedPath = await bridge.dialog.openFile();

      if (!pickedPath) return null;

      return pickedPath;
    }

    const response = await window.electronAPI.system.pickImage();

    if (!response.success || !response.data) return null;

    return response.data;
  };

  const encodeImage = async (caminhoImagem: string): Promise<string> => {
    const encodedImage =
      await window.electronAPI.webUtilities.readFileAsDataUrl(caminhoImagem);
    return encodedImage;
  };

  const loadExistingImage = async (path: string) => {
    if (!path) return;

    const encodedImage = await encodeImage(path);

    setPreviewSrc(encodedImage);
  };

  return {
    getPreview,
    encodeImage,
    setPreviewSrc,
    loadExistingImage,
    previewSrc,
  };
}
