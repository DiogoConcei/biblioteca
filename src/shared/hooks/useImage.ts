import { useState } from 'react';

export default function useImage() {
  const [previewSrc, setPreviewSrc] = useState<string | null>('');

  const getPreview = async (): Promise<string> => {
    const imagePath = await pickImage();

    if (!imagePath) return '';

    await loadExistingImage(imagePath);
    return imagePath;
  };

  const pickImage = async (): Promise<string | null> => {
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

    if (
      path.startsWith('data:') ||
      path.startsWith('http') ||
      path.startsWith('media://') ||
      path.startsWith('asset://')
    ) {
      setPreviewSrc(path);
      return;
    }

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
